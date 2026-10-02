import { inject, injectable } from 'tsyringe';
import { ShopeeHttpClient } from './shopeeHttpClient';
import { ShopeeOrderService } from './shopeeOrderService';
import { logger } from '@/shared/utils/logger';

const SHIPPING_DOCUMENT_TYPE = 'THERMAL_AIR_WAYBILL';
const TRACKING_POLL_ATTEMPTS = 3;
const TRACKING_POLL_DELAY_MS = 2000;
const DOCUMENT_POLL_ATTEMPTS = 3;
const DOCUMENT_POLL_DELAY_MS = 2000;

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
    try {
      const shipResponse = await this.httpClient.post<any>('/logistics/batch_ship_order', {
        order_list: [{ order_sn: orderSn }],
      });
      const shipItem = getResultItem(shipResponse, orderSn);
      if (shipResponse.error || shipItem?.fail_error) {
        logger.warn(
          `[SHOPEE LABEL] batch_ship_order retornou aviso para ${orderSn}: ${shipResponse.message || shipResponse.error || shipItem?.fail_message}`
        );
      }
    } catch (error: any) {
      // Pedido já confirmado anteriormente também pode cair aqui — não bloqueia o fluxo.
      logger.warn(`[SHOPEE LABEL] batch_ship_order falhou para ${orderSn} (seguindo mesmo assim): ${error.message}`);
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
      return {
        success: false,
        errorCode: 'NOT_PRINTABLE',
        error: 'A Shopee ainda não atribuiu um código de rastreio a este pedido. Isso pode levar alguns minutos após a confirmação de envio — tente novamente em instantes.',
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
