import { injectable, inject } from 'tsyringe';
import axios from 'axios';
import { MercadoLivreHttpClient } from './mercadoLivreHttpClient';
import { MercadoLivreTokenRepository } from '../repositories/mercadoLivreTokenRepository';
import { logger } from '@/shared/utils/logger';

const ML_API_BASE = 'https://api.mercadolibre.com';

export interface EnviarNFeResult {
  success: boolean;
  shipmentId?: string;
  error?: string;
}

@injectable()
export class MercadoLivreFiscalService {
  constructor(
    @inject(MercadoLivreHttpClient)
    private readonly httpClient: MercadoLivreHttpClient,
    @inject(MercadoLivreTokenRepository)
    private readonly tokenRepository: MercadoLivreTokenRepository,
  ) {}

  /**
   * Envia a NF-e (XML) para o Mercado Livre.
   * Fluxo:
   * 1. Buscar o shipment_id a partir do order_id
   * 2. Verificar se o shipment está em invoice_pending
   * 3. Enviar o XML via POST /shipments/{shipmentId}/invoice_data
   */
  async enviarNFe(orderIdML: string, xmlContent: string): Promise<EnviarNFeResult> {
    logger.info(`[ML FISCAL] Iniciando envio de NF-e para pedido ML: ${orderIdML}`);

    // 1. Buscar dados do pedido para obter shipment_id
    let shipmentId: string;
    try {
      const orderData: any = await this.httpClient.get(`/orders/${orderIdML}`);
      const shipments = orderData.shipments;

      if (!shipments || shipments.length === 0) {
        logger.warn(`[ML FISCAL] Pedido ${orderIdML} não possui shipments.`);
        return { success: false, error: 'Pedido não possui shipments no Mercado Livre.' };
      }

      shipmentId = String(shipments[0]);
      logger.info(`[ML FISCAL] Shipment ID encontrado: ${shipmentId}`);
    } catch (error: any) {
      logger.error(`[ML FISCAL] Erro ao buscar pedido ${orderIdML}: ${error.message}`);
      return { success: false, error: `Erro ao buscar pedido no ML: ${error.message}` };
    }

    // 2. Verificar status do shipment
    try {
      const shipmentData: any = await this.httpClient.get(`/shipments/${shipmentId}`);
      const status = shipmentData.status;
      const substatus = shipmentData.substatus;

      logger.info(`[ML FISCAL] Status do shipment ${shipmentId}: ${status}/${substatus}`);

      if (status !== 'ready_to_ship' || substatus !== 'invoice_pending') {
        logger.warn(
          `[ML FISCAL] Shipment ${shipmentId} não está em invoice_pending. ` +
          `Status atual: ${status}/${substatus}. NF-e será salva para reenvio posterior.`
        );
        return {
          success: false,
          shipmentId,
          error: `Shipment não está em invoice_pending. Status: ${status}/${substatus}`,
        };
      }
    } catch (error: any) {
      logger.error(`[ML FISCAL] Erro ao verificar status do shipment ${shipmentId}: ${error.message}`);
      return { success: false, error: `Erro ao verificar shipment: ${error.message}` };
    }

    // 3. Enviar XML da NF-e
    try {
      const token = await this.tokenRepository.findActive();
      if (!token) {
        return { success: false, error: 'Nenhum token Mercado Livre ativo encontrado.' };
      }

      const response = await axios.post(
        `${ML_API_BASE}/shipments/${shipmentId}/invoice_data/?siteId=MLB`,
        xmlContent,
        {
          headers: {
            'Content-Type': 'application/xml',
            'Authorization': `Bearer ${token.access_token}`,
          },
          timeout: 30000,
        }
      );

      logger.success(`[ML FISCAL] NF-e enviada com sucesso para shipment ${shipmentId}`);
      return { success: true, shipmentId };
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.error;

      logger.error(`[ML FISCAL] Erro ao enviar NF-e para shipment ${shipmentId}: ${errorMsg}`, {
        status: error.response?.status,
        error: errorCode,
      });

      return {
        success: false,
        shipmentId,
        error: `Erro ao enviar NF-e para ML: ${errorMsg}`,
      };
    }
  }
}
