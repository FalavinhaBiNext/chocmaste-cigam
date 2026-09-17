import { injectable, inject } from 'tsyringe';
import axios from 'axios';
import { MercadoLivreHttpClient } from './mercadoLivreHttpClient';
import { MercadoLivreFiscalService } from './mercadoLivreFiscalService';
import { MercadoLivreTokenRepository } from '../repositories/mercadoLivreTokenRepository';
import { logger } from '@/shared/utils/logger';

const ML_API_BASE = 'https://api.mercadolibre.com';

// A Mercado Envios só disponibiliza a etiqueta pra esses tipos de logística.
// Fulfillment não entra aqui — o próprio ML cuida do envio nesse caso.
const LOGISTIC_TYPES_COM_ETIQUETA = ['drop_off', 'xd_drop_off', 'cross_docking', 'self_service'];

export interface ShippingLabelResult {
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  filename?: string;
  error?: string;
  errorCode?: 'NOT_PRINTABLE' | 'NOT_SUPPORTED_LOGISTIC_TYPE' | 'NO_SHIPMENT' | 'ML_ERROR';
}

@injectable()
export class MercadoLivreShippingLabelService {
  constructor(
    @inject(MercadoLivreFiscalService)
    private readonly fiscalService: MercadoLivreFiscalService,
    @inject(MercadoLivreHttpClient)
    private readonly httpClient: MercadoLivreHttpClient,
    @inject(MercadoLivreTokenRepository)
    private readonly tokenRepository: MercadoLivreTokenRepository,
  ) {}

  /**
   * Busca a etiqueta a partir do numero_pedido_cigam, reaproveitando a mesma
   * resolução de shipment_id (com cache) já usada pro envio de NF-e.
   */
  async obterEtiquetaPorPedidoCigam(numeroPedidoCigam: string): Promise<ShippingLabelResult> {
    const shipmentInfo = await this.fiscalService.resolverShipmentId(numeroPedidoCigam);
    if (!shipmentInfo.success || !shipmentInfo.shipmentId) {
      return { success: false, error: shipmentInfo.error, errorCode: 'NO_SHIPMENT' };
    }

    return this.obterEtiquetaPorShipmentId(shipmentInfo.shipmentId);
  }

  /**
   * Fluxo:
   * 1. Verificar status/substatus/logistic_type do shipment
   * 2. Baixar a etiqueta (ZIP com PDF + TXT Zebra) via GET /shipment_labels
   */
  async obterEtiquetaPorShipmentId(shipmentId: string): Promise<ShippingLabelResult> {
    let logisticType: string | undefined;

    try {
      const shipmentData: any = await this.httpClient.get(`/shipments/${shipmentId}`);
      const status = shipmentData.status;
      const substatus = shipmentData.substatus;
      logisticType = shipmentData.logistic?.type ?? shipmentData.logistic_type ?? undefined;

      logger.info(
        `[ML LABEL] Status do shipment ${shipmentId}: ${status}/${substatus}. logistic_type: ${logisticType ?? 'não retornado pelo ML'}.`
      );

      if (logisticType && !LOGISTIC_TYPES_COM_ETIQUETA.includes(logisticType)) {
        logger.warn(`[ML LABEL] Shipment ${shipmentId} é logistic_type "${logisticType}" — etiqueta não disponível via API pra esse tipo (ex.: fulfillment).`);
        return {
          success: false,
          errorCode: 'NOT_SUPPORTED_LOGISTIC_TYPE',
          error: `Envios do tipo "${logisticType}" não têm etiqueta disponível por essa API (ex.: Fulfillment é gerenciado diretamente pelo Mercado Livre).`,
        };
      }

      if (status !== 'ready_to_ship' || substatus !== 'ready_to_print') {
        logger.warn(`[ML LABEL] Shipment ${shipmentId} ainda não está pronto pra impressão. Status atual: ${status}/${substatus}.`);
        return {
          success: false,
          errorCode: 'NOT_PRINTABLE',
          error: `Etiqueta ainda não liberada pelo Mercado Livre. Status atual: ${status}/${substatus}. Aguarde o marketplace liberar a impressão.`,
        };
      }
    } catch (error: any) {
      logger.error(`[ML LABEL] Erro ao verificar status do shipment ${shipmentId}: ${error.message}`);
      return { success: false, errorCode: 'ML_ERROR', error: `Erro ao verificar shipment: ${error.message}` };
    }

    try {
      const token = await this.tokenRepository.findActive();
      if (!token) {
        return { success: false, errorCode: 'ML_ERROR', error: 'Nenhum token Mercado Livre ativo encontrado.' };
      }

      const response = await axios.get(
        `${ML_API_BASE}/shipment_labels`,
        {
          params: {
            shipment_ids: shipmentId,
            response_type: 'pdf',
          },
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
          },
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      );

      logger.success(`[ML LABEL] Etiqueta do shipment ${shipmentId} baixada com sucesso.`);

      return {
        success: true,
        buffer: Buffer.from(response.data),
        contentType: 'application/zip',
        filename: `etiqueta-${shipmentId}.zip`,
      };
    } catch (error: any) {
      const status = error.response?.status;
      let errorMsg = error.message;
      try {
        // O corpo de erro do ML às vezes vem em JSON mesmo com responseType arraybuffer.
        const parsed = JSON.parse(Buffer.from(error.response?.data ?? '').toString('utf-8'));
        errorMsg = parsed?.message || errorMsg;
      } catch {
        // corpo não era JSON — mantém error.message
      }

      logger.error(`[ML LABEL] Erro ao baixar etiqueta do shipment ${shipmentId}: ${errorMsg}`, { status });

      return {
        success: false,
        errorCode: status === 400 ? 'NOT_PRINTABLE' : 'ML_ERROR',
        error: `Erro ao baixar etiqueta no ML: ${errorMsg}`,
      };
    }
  }
}
