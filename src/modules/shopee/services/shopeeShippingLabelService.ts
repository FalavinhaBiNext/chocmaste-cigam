import { inject, injectable } from 'tsyringe';
import { ShopeeHttpClient } from './shopeeHttpClient';
import { ShopeeOrderService } from './shopeeOrderService';
import { logger } from '@/shared/utils/logger';

const SHIPPING_DOCUMENT_TYPE = 'THERMAL_AIR_WAYBILL';
const TRACKING_POLL_ATTEMPTS = 3;
const TRACKING_POLL_DELAY_MS = 2000;
const DOCUMENT_POLL_ATTEMPTS = 3;
const DOCUMENT_POLL_DELAY_MS = 2000;

/**
 * batch_ship_order só funciona pro canal logístico 90003 (padrão das lojas BR).
 * Pedidos em outros canais retornam esse tipo de mensagem e precisam do
 * endpoint singular v2.logistics.ship_order como fallback.
 */
const BATCH_NAO_SUPORTADO_PATTERN = /can'?t batch ship|batch ship order|do(?:es)? not support batch/i;

export interface ShippingLabelResult {
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  filename?: string;
  error?: string;
  errorCode?: 'NOT_PRINTABLE' | 'SHOPEE_ERROR';
}

/**
 * Todo endpoint de /logistics/ embrulha os dados reais em "response" — confirmado
 * contra a doc oficial (open.shopee.com/documents, módulo 95) para
 * create_shipping_document, get_shipping_document_parameter, get_tracking_number,
 * get_tracking_info, get_shipping_parameter, get_channel_list e get_address_list.
 * Falhas por item vêm dentro de response.result_list[].fail_error/fail_message
 * mesmo com HTTP 200 — checar isso além do campo "error" de topo.
 */
function getResultItem(response: any, orderSn: string): any {
  const list = response?.response?.result_list;
  return Array.isArray(list) ? list.find((r: any) => r.order_sn === orderSn) : undefined;
}

function mapShippingDocumentError(rawMessage: string): string {
  const msg = rawMessage || '';

  if (/invoice/i.test(msg)) {
    return 'A NF-e deste pedido ainda não foi enviada/validada pela Shopee. Envie a NF-e antes de gerar a etiqueta.';
  }
  if (/order status|not allow|invalid order/i.test(msg)) {
    return 'O pedido não está em um status que permite gerar etiqueta (confirme se já está pronto para envio).';
  }

  return msg;
}

@injectable()
export class ShopeeShippingLabelService {
  constructor(
    @inject(ShopeeHttpClient) private readonly httpClient: ShopeeHttpClient,
    @inject(ShopeeOrderService) private readonly orderService: ShopeeOrderService,
  ) {}

  /**
   * Fallback para pedidos cujo canal logístico não aceita batch_ship_order.
   * Fluxo: v2.logistics.get_shipping_parameter (descobre se é pickup ou dropoff
   * e os IDs necessários) → v2.logistics.ship_order (confirma com esses IDs).
   * Dropoff exige sender_real_name, que a Shopee não devolve — vem da env
   * SHOPEE_SENDER_NAME (nome do remetente cadastrado na loja).
   */
  private async confirmarEnvioIndividual(orderSn: string): Promise<{ success: boolean; error?: string }> {
    let paramResponse: any;
    try {
      paramResponse = await this.httpClient.get<any>('/logistics/get_shipping_parameter', {
        order_sn: orderSn,
      });
    } catch (error: any) {
      return { success: false, error: `Falha ao consultar get_shipping_parameter: ${error.message}` };
    }

    if (paramResponse.error) {
      return { success: false, error: paramResponse.message || paramResponse.error };
    }

    const info = paramResponse.response?.info_needed || {};
    const body: Record<string, any> = { order_sn: orderSn };

    if (info.pickup) {
      const address = paramResponse.response?.pickup?.address_list?.[0];
      const pickupTimeId = address?.time_slot_list?.[0]?.pickup_time_id;
      if (!address || !pickupTimeId) {
        return {
          success: false,
          error: 'A Shopee exige coleta (pickup) para este pedido, mas não retornou endereço/horário disponível.',
        };
      }
      body.pickup = { address_id: address.address_id, pickup_time_id: pickupTimeId };
    } else if (info.dropoff) {
      const branch = paramResponse.response?.dropoff?.branch_list?.[0];
      if (!branch) {
        return {
          success: false,
          error: 'A Shopee exige postagem (dropoff) para este pedido, mas não retornou nenhum ponto de entrega disponível.',
        };
      }
      const senderName = process.env.SHOPEE_SENDER_NAME;
      if (!senderName) {
        return {
          success: false,
          error: 'SHOPEE_SENDER_NAME não configurado no servidor (necessário para confirmar postagem/dropoff deste pedido).',
        };
      }
      body.dropoff = { branch_id: branch.branch_id, sender_real_name: senderName };
    } else {
      return {
        success: false,
        error: 'A Shopee não indicou um método de envio (pickup/dropoff) suportado para este pedido via get_shipping_parameter.',
      };
    }

    try {
      const shipResponse = await this.httpClient.post<any>('/logistics/ship_order', body);
      if (shipResponse.error) {
        return { success: false, error: shipResponse.message || shipResponse.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }

    logger.success(`[SHOPEE LABEL] ship_order (individual) confirmado com sucesso para ${orderSn}`);
    return { success: true };
  }

  /**
   * Fluxo completo de emissão de etiqueta (confirmado contra a doc oficial da Shopee):
   * 1. batch_ship_order — confirma o envio do pedido. Lojas do Brasil usam o endpoint
   *    em lote (canal logístico 90003), não o v2.logistics.ship_order singular.
   * 2. get_tracking_number — a Shopee só aceita criar o documento depois que o pedido
   *    tem código de rastreio atribuído; isso pode não ser imediato após o passo 1.
   * 3. create_shipping_document — dispara a geração do documento (assíncrono).
   *    shipping_document_type fica DENTRO de cada item de order_list aqui.
   * 4. get_shipping_document_result — poll até o status ficar READY.
   * 5. download_shipping_document — baixa o PDF (resposta binária direta). Aqui
   *    shipping_document_type é campo irmão de order_list, não item por item —
   *    diferente do passo 3.
   */
  async obterEtiqueta(orderSn: string): Promise<ShippingLabelResult> {
    // Guarda o motivo específico de falha do batch_ship_order (fail_error/fail_message
    // do item, não a mensagem genérica de topo tipo "All failed, please check
    // result_list for detail") — usado depois pra explicar por que o tracking
    // number nunca chegou, em vez de só dizer "tente novamente em instantes".
    let motivoFalhaShipOrder: string | undefined;

    try {
      const shipResponse = await this.httpClient.post<any>('/logistics/batch_ship_order', {
        order_list: [{ order_sn: orderSn }],
      });
      const shipItem = getResultItem(shipResponse, orderSn);
      if (shipResponse.error || shipItem?.fail_error) {
        motivoFalhaShipOrder = shipItem?.fail_message || shipItem?.fail_error || shipResponse.message || shipResponse.error;
        logger.warn(
          `[SHOPEE LABEL] batch_ship_order retornou aviso para ${orderSn} — item: ${shipItem?.fail_error ?? 'n/a'} / ${shipItem?.fail_message ?? 'n/a'} | topo: ${shipResponse.message ?? shipResponse.error ?? 'n/a'}`
        );
      }
    } catch (error: any) {
      // Pedido já confirmado anteriormente também pode cair aqui — não bloqueia o fluxo.
      motivoFalhaShipOrder = error.message;
      logger.warn(`[SHOPEE LABEL] batch_ship_order falhou para ${orderSn} (seguindo mesmo assim): ${error.message}`);
    }

    if (motivoFalhaShipOrder && BATCH_NAO_SUPORTADO_PATTERN.test(motivoFalhaShipOrder)) {
      logger.info(`[SHOPEE LABEL] Canal logístico de ${orderSn} não aceita batch_ship_order — tentando ship_order individual...`);
      const fallback = await this.confirmarEnvioIndividual(orderSn);
      if (fallback.success) {
        motivoFalhaShipOrder = undefined;
      } else {
        logger.warn(`[SHOPEE LABEL] Fallback ship_order individual também falhou para ${orderSn}: ${fallback.error}`);
        motivoFalhaShipOrder = `${motivoFalhaShipOrder} | Fallback ship_order individual também falhou: ${fallback.error}`;
      }
    }

    let trackingNumber: string | undefined;
    for (let attempt = 0; attempt < TRACKING_POLL_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, TRACKING_POLL_DELAY_MS));
      }
      try {
        const tracking = await this.orderService.buscarNumeroRastreio(orderSn);
        if (tracking.trackingNumber) {
          trackingNumber = tracking.trackingNumber;
          break;
        }
      } catch (error: any) {
        logger.warn(`[SHOPEE LABEL] Erro ao consultar tracking number de ${orderSn} (tentativa ${attempt + 1}/${TRACKING_POLL_ATTEMPTS}): ${error.message}`);
      }
    }

    if (!trackingNumber) {
      const sufixoMotivo = motivoFalhaShipOrder
        ? ` Motivo reportado pela Shopee ao confirmar o envio: ${motivoFalhaShipOrder}`
        : '';
      return {
        success: false,
        errorCode: 'NOT_PRINTABLE',
        error: `A Shopee ainda não atribuiu um código de rastreio a este pedido. Isso pode levar alguns minutos após a confirmação de envio — tente novamente em instantes.${sufixoMotivo}`,
      };
    }

    try {
      const createResponse = await this.httpClient.post<any>('/logistics/create_shipping_document', {
        order_list: [{
          order_sn: orderSn,
          tracking_number: trackingNumber,
          shipping_document_type: SHIPPING_DOCUMENT_TYPE,
        }],
      });

      const createItem = getResultItem(createResponse, orderSn);
      if (createResponse.error || createItem?.fail_error) {
        const rawMessage = createResponse.message || createResponse.error || createItem?.fail_message;
        logger.error(`[SHOPEE LABEL] Erro ao criar documento de envio para ${orderSn}: ${rawMessage}`);
        return { success: false, errorCode: 'SHOPEE_ERROR', error: mapShippingDocumentError(rawMessage) };
      }
    } catch (error: any) {
      logger.error(`[SHOPEE LABEL] Erro ao criar documento de envio para ${orderSn}: ${error.message}`);
      return { success: false, errorCode: 'SHOPEE_ERROR', error: mapShippingDocumentError(error.message) };
    }

    let ready = false;
    for (let attempt = 0; attempt < DOCUMENT_POLL_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, DOCUMENT_POLL_DELAY_MS));
      }

      try {
        const resultResponse = await this.httpClient.post<any>('/logistics/get_shipping_document_result', {
          order_list: [{ order_sn: orderSn }],
        });

        const orderResult = getResultItem(resultResponse, orderSn);
        const status = orderResult?.status;
        logger.info(`[SHOPEE LABEL] Status do documento do pedido ${orderSn}: ${status ?? 'desconhecido'} (tentativa ${attempt + 1}/${DOCUMENT_POLL_ATTEMPTS})`);

        if (status === 'READY') {
          ready = true;
          break;
        }
        if (status === 'FAILED') {
          return {
            success: false,
            errorCode: 'SHOPEE_ERROR',
            error: orderResult?.fail_message || 'A Shopee falhou ao gerar o documento de envio deste pedido.',
          };
        }
      } catch (error: any) {
        logger.warn(`[SHOPEE LABEL] Erro ao consultar status do documento de ${orderSn}: ${error.message}`);
      }
    }

    if (!ready) {
      return {
        success: false,
        errorCode: 'NOT_PRINTABLE',
        error: 'A etiqueta ainda está sendo processada pela Shopee. Tente novamente em alguns segundos.',
      };
    }

    try {
      const buffer = await this.httpClient.postBinary('/logistics/download_shipping_document', {
        order_list: [{ order_sn: orderSn }],
        shipping_document_type: SHIPPING_DOCUMENT_TYPE,
      });

      logger.success(`[SHOPEE LABEL] Etiqueta do pedido ${orderSn} baixada com sucesso.`);

      return {
        success: true,
        buffer,
        contentType: 'application/pdf',
        filename: `etiqueta-${orderSn}.pdf`,
      };
    } catch (error: any) {
      logger.error(`[SHOPEE LABEL] Erro ao baixar etiqueta do pedido ${orderSn}: ${error.message}`);
      return { success: false, errorCode: 'SHOPEE_ERROR', error: mapShippingDocumentError(error.message) };
    }
  }
}
