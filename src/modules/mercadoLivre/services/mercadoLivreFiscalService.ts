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
      const resolved = await this.httpClient.getOrderOrPack(pedido.numero_loja);
      const shipmentId = resolved.shipmentId;

      if (!shipmentId) {
        logger.warn(`[ML FISCAL] Pedido/Pacote ML #${pedido.numero_loja} não possui shipping_id no ML.`);
        return { success: false, error: 'Pedido não possui shipments no Mercado Livre.' };
      }

      await this.pedidoService.update(pedido.id, { shipping_id: shipmentId });
      logger.info(`[ML FISCAL] shipping_id ${shipmentId} salvo no pedido ${pedido.id} (tipo: ${resolved.type})`);

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
    let sellerId: string | undefined;
    let receiverZipCode: string | undefined;

    try {
      const shipmentData: any = await this.httpClient.get(`/shipments/${shipmentId}`);
      const status = shipmentData.status;
      const substatus = shipmentData.substatus;
      sellerId = shipmentData.sender_id ? String(shipmentData.sender_id) : undefined;
      receiverZipCode = shipmentData.receiver_address?.zip_code
        ? String(shipmentData.receiver_address.zip_code)
        : undefined;

      const cepNfe = this.extrairCepDestinatario(xmlContent);
      logger.info(
        `[ML FISCAL] Status do shipment ${shipmentId}: ${status}/${substatus}. Dono do shipment (sender_id): ${sellerId ?? 'não retornado pelo ML'}. ` +
        `CEP do destinatário no ML: ${receiverZipCode ?? 'não retornado pelo ML'}. CEP do destinatário na NF-e: ${cepNfe ?? 'não encontrado no XML'}.` +
        (receiverZipCode && cepNfe && this.normalizarCep(receiverZipCode) !== this.normalizarCep(cepNfe)
          ? ' ATENÇÃO: CEPs divergentes — é isso que vai causar o erro "wrong_receiver_zipcode" no envio.'
          : '')
      );

      // Se a NF-e já foi processada anteriormente e a etiqueta já está pronta, impressa ou despachada
      const substatusAceitos = ['ready_to_print', 'printed', 'dropped_off', 'in_hub', 'in_transit', 'out_for_delivery'];
      const jaProcessadoNoMl =
        (status === 'ready_to_ship' && substatusAceitos.includes(substatus)) ||
        status === 'shipped' ||
        status === 'delivered';

      if (jaProcessadoNoMl) {
        logger.success(
          `[ML FISCAL] NF-e já foi aceita e processada no Mercado Livre para o shipment ${shipmentId} (Status: ${status}/${substatus}). Marcando como enviada.`
        );
        return {
          success: true,
          shipmentId,
        };
      }

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

      const contaDivergente = sellerId && token.user_id_ml && sellerId !== token.user_id_ml;
      logger.info(
        `[ML FISCAL] Conta do token ativo: user_id_ml=${token.user_id_ml}, scope="${token.scope}". ` +
        `Dono do shipment: sender_id=${sellerId ?? 'desconhecido'}.` +
        (contaDivergente ? ' ATENÇÃO: user_id_ml do token é DIFERENTE do sender_id do shipment — o token pode não ter permissão sobre esse pedido.' : '')
      );

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

  /** Extrai o CEP de dentro do bloco <dest>...</dest> do XML da NF-e (destinatário, não emitente). */
  private extrairCepDestinatario(xml: string): string | null {
    const destMatch = xml.match(/<dest>[\s\S]*?<\/dest>/);
    if (!destMatch) return null;

    const cepMatch = destMatch[0].match(/<CEP>(\d+)<\/CEP>/);
    return cepMatch ? cepMatch[1] : null;
  }

  /** Remove tudo que não for dígito, pra comparar CEPs em formatos diferentes (com/sem hífen). */
  private normalizarCep(cep: string): string {
    return cep.replace(/\D/g, '');
  }
}
