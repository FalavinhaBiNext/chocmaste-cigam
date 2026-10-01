import { inject, injectable } from 'tsyringe';
import { ShopeeHttpClient } from './shopeeHttpClient';
import { logger } from '@/shared/utils/logger';

const SHIPPING_DOCUMENT_TYPE = 'THERMAL_AIR_WAYBILL';
const POLL_ATTEMPTS = 3;
const POLL_DELAY_MS = 2000;

export interface ShippingLabelResult {
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  filename?: string;
  error?: string;
  errorCode?: 'NOT_PRINTABLE' | 'SHOPEE_ERROR';
}

/**
 * Traduz mensagens de erro da Shopee pros passos de geração de etiqueta.
 * NOTA: os nomes de endpoint/campo usados neste serviço (ship_order,
 * create_shipping_document, get_shipping_document_result,
 * download_shipping_document) vêm do conhecimento geral da API pública da
 * Shopee — diferente do upload_invoice_doc, não foram confirmados contra a
 * doc oficial nesta conversa. Validar no sandbox e ajustar nomes de campo
 * aqui caso a Shopee devolva erro de parâmetro inválido.
 */
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
  ) {}

  /**
   * Fluxo completo de emissão de etiqueta:
   * 1. ship_order — confirma o envio do pedido (idempotente: se já confirmado, segue em frente)
   * 2. create_shipping_document — dispara a geração do PDF (assíncrono)
   * 3. get_shipping_document_result — poll até o documento ficar pronto
   * 4. download_shipping_document — baixa o PDF
   */
  async obterEtiqueta(orderSn: string): Promise<ShippingLabelResult> {
    try {
      const shipResponse = await this.httpClient.post<any>('/logistics/ship_order', { order_sn: orderSn });
      if (shipResponse.error) {
        logger.warn(`[SHOPEE LABEL] ship_order retornou aviso para ${orderSn}: ${shipResponse.message || shipResponse.error}`);
      }
    } catch (error: any) {
      // Pedido já confirmado anteriormente também cai aqui como erro — não bloqueia o fluxo.
      logger.warn(`[SHOPEE LABEL] ship_order falhou para ${orderSn} (seguindo mesmo assim): ${error.message}`);
    }

    try {
      const createResponse = await this.httpClient.post<any>('/logistics/create_shipping_document', {
        order_list: [{ order_sn: orderSn }],
        shipping_document_type: SHIPPING_DOCUMENT_TYPE,
      });

      if (createResponse.error) {
        const friendlyError = mapShippingDocumentError(createResponse.message || createResponse.error);
        logger.error(`[SHOPEE LABEL] Erro ao criar documento de envio para ${orderSn}: ${createResponse.message || createResponse.error}`);
        return { success: false, errorCode: 'SHOPEE_ERROR', error: friendlyError };
      }
    } catch (error: any) {
      logger.error(`[SHOPEE LABEL] Erro ao criar documento de envio para ${orderSn}: ${error.message}`);
      return { success: false, errorCode: 'SHOPEE_ERROR', error: mapShippingDocumentError(error.message) };
    }

    let ready = false;
    for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, POLL_DELAY_MS));
      }

      try {
        const resultResponse = await this.httpClient.post<any>('/logistics/get_shipping_document_result', {
          order_list: [{ order_sn: orderSn }],
        });

        const orderResult = resultResponse.result_list?.find((r: any) => r.order_sn === orderSn);
        const status = orderResult?.status;
        logger.info(`[SHOPEE LABEL] Status do documento do pedido ${orderSn}: ${status ?? 'desconhecido'} (tentativa ${attempt + 1}/${POLL_ATTEMPTS})`);

        if (status === 'READY') {
          ready = true;
          break;
        }
        if (status === 'FAILED') {
          return { success: false, errorCode: 'SHOPEE_ERROR', error: 'A Shopee falhou ao gerar o documento de envio deste pedido.' };
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
