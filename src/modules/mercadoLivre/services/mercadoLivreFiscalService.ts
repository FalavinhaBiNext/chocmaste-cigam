import { injectable, inject } from 'tsyringe';
import axios from 'axios';
import { MercadoLivreHttpClient } from './mercadoLivreHttpClient';
import { MercadoLivreTokenRepository } from '../repositories/mercadoLivreTokenRepository';
import { PedidoService } from '@/modules/pedido/services/pedidoService';
import { logger } from '@/shared/utils/logger';

const ML_API_BASE = 'https://api.mercadolibre.com';

export interface EnviarNFeResult {
  success: boolean;
  shipmentId?: string;
  error?: string;
}

export interface ResolverShipmentIdResult {
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
    @inject(PedidoService)
    private readonly pedidoService: PedidoService,
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

    return this.verificarEEnviar(shipmentId, xmlContent);
  }

  /**
   * Resolve o shipment_id de um pedido a partir do numero_pedido_cigam, usando o
   * cache local (pedidos.shipping_id) quando disponível. Se não houver cache,
   * replica a resolução feita em MercadoLivreController.getShipmentStatus:
   * busca o pedido no ML por numero_loja, extrai o shipping.id e salva no pedido
   * local para reaproveitar da próxima vez.
   */
  async resolverShipmentId(numeroPedidoCigam: string): Promise<ResolverShipmentIdResult> {
    const pedido = await this.pedidoService.findByNumeroPedidoCigam(numeroPedidoCigam);
    if (!pedido) {
      return { success: false, error: `Pedido CIGAM #${numeroPedidoCigam} não encontrado na tabela de pedidos.` };
    }

    if (pedido.shipping_id) {
      logger.info(`[ML FISCAL] shipping_id em cache para pedido ${pedido.id}: ${pedido.shipping_id}`);
      return { success: true, shipmentId: pedido.shipping_id };
    }

    logger.info(`[ML FISCAL] Pedido ${pedido.id} sem shipping_id em cache. Buscando no ML via numero_loja=${pedido.numero_loja}...`);

    try {
      const orderData: any = await this.httpClient.get(`/orders/${pedido.numero_loja}`);
      const shipmentId = orderData.shipping?.id ? String(orderData.shipping.id) : null;

      if (!shipmentId) {
        logger.warn(`[ML FISCAL] Pedido ML #${pedido.numero_loja} não possui shipping_id no ML.`);
        return { success: false, error: 'Pedido não possui shipments no Mercado Livre.' };
      }

      await this.pedidoService.update(pedido.id, { shipping_id: shipmentId });
      logger.info(`[ML FISCAL] shipping_id ${shipmentId} salvo no pedido ${pedido.id}`);

      return { success: true, shipmentId };
    } catch (error: any) {
      logger.error(`[ML FISCAL] Erro ao buscar pedido ML #${pedido.numero_loja}: ${error.message}`);
      return { success: false, error: `Erro ao buscar pedido no ML: ${error.message}` };
    }
  }

  /**
   * Envia a NF-e usando um shipment_id já conhecido (pula a busca por order_id).
   */
  async enviarNFePorShipmentId(shipmentId: string, xmlContent: string): Promise<EnviarNFeResult> {
    logger.info(`[ML FISCAL] Iniciando envio de NF-e direto pelo shipment ${shipmentId}`);
    return this.verificarEEnviar(shipmentId, xmlContent);
  }

  /**
   * 2. Verificar se o shipment está em invoice_pending
   * 3. Enviar o XML via POST /shipments/{shipmentId}/invoice_data
   */
  private async verificarEEnviar(shipmentId: string, xmlContent: string): Promise<EnviarNFeResult> {
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

    try {
      const token = await this.tokenRepository.findActive();
      if (!token) {
        return { success: false, error: 'Nenhum token Mercado Livre ativo encontrado.' };
      }

      await axios.post(
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
