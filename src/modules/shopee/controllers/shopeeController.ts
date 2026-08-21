import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { ShopeeAuthService } from '../services/shopeeAuthService';
import { ShopeeTokenRepository } from '../repositories/shopeeTokenRepository';
import { ShopeeOrderService } from '../services/shopeeOrderService';
import { ShopeeFiscalService } from '../services/shopeeFiscalService';
import { PedidoService } from '@/modules/pedido/services/pedidoService';
import { NotasFiscaisCigamRepository } from '@/modules/notasFiscaisCigam/repositories/notasFiscaisCigamRepository';
import { logger } from '@/shared/utils/logger';
import { ValidationError } from '@/shared/errors/AppError';

@injectable()
export class ShopeeController {
  constructor(
    @inject(ShopeeAuthService) private readonly authService: ShopeeAuthService,
    @inject(ShopeeTokenRepository) private readonly tokenRepository: ShopeeTokenRepository,
    @inject(ShopeeOrderService) private readonly orderService: ShopeeOrderService,
    @inject(ShopeeFiscalService) private readonly fiscalService: ShopeeFiscalService,
    @inject(PedidoService) private readonly pedidoService: PedidoService,
    @inject(NotasFiscaisCigamRepository) private readonly notasFiscaisRepo: NotasFiscaisCigamRepository,
  ) {}

  /**
   * Gera a URL de autorização para o usuário redirecionar à Shopee.
   * GET /shopee/auth-url
   */
  getAuthUrl = async (_req: Request, res: Response): Promise<void> => {
    const partnerId = process.env.SHOPEE_PARTNER_ID;
    const redirectUri = process.env.SHOPEE_REDIRECT_URI;

    if (!partnerId || !redirectUri) {
      res.status(500).json({
        success: false,
        message: 'SHOPEE_PARTNER_ID e SHOPEE_REDIRECT_URI não configurados no servidor.',
      });
      return;
    }

    const state = Math.random().toString(36).substring(2, 15);
    const authUrl = this.authService.generateAuthURL(partnerId, redirectUri, state);

    res.status(200).json({
      success: true,
      data: { authUrl, state },
    });
  }

  /**
   * Callback OAuth2 - recebe o code e troca por token.
   * GET /shopee/callback?code=xxx&shop_id=xxx
   */
  handleCallback = async (req: Request, res: Response): Promise<void> => {
    const { code, shop_id } = req.query;

    if (!code) {
      throw new ValidationError('Código de autorização não fornecido.');
    }

    if (!shop_id) {
      throw new ValidationError('Shop ID não fornecido.');
    }

    const partnerId = process.env.SHOPEE_PARTNER_ID;
    const partnerKey = process.env.SHOPEE_PARTNER_KEY;

    if (!partnerId || !partnerKey) {
      res.status(500).json({
        success: false,
        message: 'SHOPEE_PARTNER_ID e SHOPEE_PARTNER_KEY não configurados no servidor.',
      });
      return;
    }

    try {
      const tokenData = await this.authService.exchangeCodeForToken(
        String(code),
        String(shop_id),
        partnerId,
        partnerKey,
      );

      res.status(200).json({
        success: true,
        message: 'Autenticação Shopee realizada com sucesso.',
        data: {
          shop_id: shop_id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expire_in: tokenData.expire_in,
        },
      });
    } catch (error: any) {
      logger.error(`Erro no callback da Shopee: ${error.message}`);
      res.status(500).json({
        success: false,
        message: `Erro ao autenticar com Shopee: ${error.message}`,
      });
    }
  }

  /**
   * Lista tokens salvos.
   * GET /shopee/tokens
   */
  listTokens = async (_req: Request, res: Response): Promise<void> => {
    const tokens = await this.tokenRepository.findAll();
    const safeTokens = tokens.map(t => ({
      id: t.id,
      shop_id: t.shop_id,
      shop_name: t.shop_name,
      active: t.active,
      region: t.region,
      expires_at: t.expires_at,
      created_at: t.created_at,
    }));

    res.status(200).json({
      success: true,
      data: safeTokens,
    });
  }

  /**
   * Remove um token (desconectar conta Shopee).
   * DELETE /shopee/tokens/:id
   */
  deleteToken = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    try {
      await this.tokenRepository.deleteById(id);
      res.status(200).json({
        success: true,
        message: 'Conta Shopee desconectada com sucesso.',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Ativa um token específico.
   * PATCH /shopee/tokens/:id/activate
   */
  activateToken = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    try {
      const token = await this.tokenRepository.findByShopId(id);
      if (!token) {
        res.status(404).json({
          success: false,
          message: 'Token não encontrado.',
        });
        return;
      }
      await this.tokenRepository.setActive(token.shop_id);
      res.status(200).json({
        success: true,
        message: 'Conta Shopee ativada com sucesso.',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Lista pedidos da Shopee.
   * GET /shopee/orders?status=xxx&limit=50
   */
  listOrders = async (req: Request, res: Response): Promise<void> => {
    const { status, limit } = req.query;
    try {
      // Buscar pedidos dos últimos 30 dias
      const now = Math.floor(Date.now() / 1000);
      const timeFrom = now - 30 * 24 * 60 * 60;
      const pageSize = Number(limit) || 50;

      const result = await this.orderService.listarPedidos(
        timeFrom,
        now,
        pageSize,
        undefined,
        status ? String(status) : undefined,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error(`[SHOPEE] Erro ao listar pedidos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Busca detalhes de um pedido da Shopee.
   * GET /shopee/orders/:orderSn
   */
  getOrder = async (req: Request, res: Response): Promise<void> => {
    const orderSn = String(req.params.orderSn);
    try {
      const orders = await this.orderService.buscarDetalhesPedido([orderSn]);
      if (orders.length === 0) {
        res.status(404).json({
          success: false,
          message: `Pedido ${orderSn} não encontrado na Shopee.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: orders[0],
      });
    } catch (error: any) {
      logger.error(`[SHOPEE] Erro ao buscar pedido ${orderSn}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Consulta o status de envio de um pedido da Shopee.
   * GET /shopee/orders/:orderSn/shipment-status
   */
  getShipmentStatus = async (req: Request, res: Response): Promise<void> => {
    const orderSn = String(req.params.orderSn);
    logger.info(`[SHOPEE SHIPMENT] ===== Iniciando verificação de shipment para pedido #${orderSn} =====`);

    try {
      // 1. Buscar detalhes do pedido para obter info de envio
      logger.info(`[SHOPEE SHIPMENT] Passo 1: Buscando detalhes do pedido #${orderSn}...`);
      const orders = await this.orderService.buscarDetalhesPedido([orderSn]);

      if (orders.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            orderSn,
            shipmentId: null,
            status: null,
            readyForInvoice: false,
            error: 'Pedido não encontrado na Shopee.',
          },
        });
        return;
      }

      const order = orders[0];
      logger.info(`[SHOPEE SHIPMENT] Pedido encontrado. Status: ${order.order_status}`);

      // 2. Buscar status de envio
      logger.info(`[SHOPEE SHIPMENT] Passo 2: Buscando status de envio...`);
      const shipment = await this.orderService.buscarStatusEnvio(orderSn);

      logger.info(`[SHOPEE SHIPMENT] Status de envio: ${shipment.logistic_status}`);

      // 3. Determinar se está pronto para invoice
      const readyForInvoice = order.order_status === 'READY_TO_SHIP' &&
        shipment.logistic_status === 'LOGISTICS_NOT_START';

      res.status(200).json({
        success: true,
        data: {
          orderSn,
          shipmentId: shipment.tracking_number || null,
          status: order.order_status,
          shippingCarrier: shipment.shipping_carrier,
          trackingNumber: shipment.tracking_number,
          logisticStatus: shipment.logistic_status,
          readyForInvoice,
        },
      });

      logger.info(`[SHOPEE SHIPMENT] ===== Verificação concluída para pedido #${orderSn} =====`);
    } catch (error: any) {
      logger.error(`[SHOPEE SHIPMENT] ERRO: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Envia XML da NF-e para a Shopee.
   * POST /shopee/orders/:orderSn/send-invoice
   */
  sendInvoice = async (req: Request, res: Response): Promise<void> => {
    const orderSn = String(req.params.orderSn);
    try {
      // Buscar nota fiscal não enviada
      const notas = await this.notasFiscaisRepo.findNotEnviadas();
      const nota = notas.find((n: any) => n.numero_pedido_marketplace === orderSn);

      if (!nota) {
        res.status(404).json({
          success: false,
          message: `Nenhuma NF-e pendente encontrada para o pedido Shopee #${orderSn}.`,
        });
        return;
      }

      logger.info(`[SHOPEE INVOICE] Enviando NF-e ${nota.id} para pedido #${orderSn}`);

      const resultado = await this.fiscalService.enviarNFe(orderSn, nota.xml_content);

      if (resultado.success) {
        await this.notasFiscaisRepo.updateEnviadoMarketplace(nota.id, true);

        // Atualizar status_nfe do pedido
        try {
          const pedido = await this.pedidoService.findByNumeroLoja(orderSn);
          if (pedido) {
            await this.pedidoService.update(pedido.id, { status_nfe: 'enviada' });
          }
        } catch {
          // Pedido pode não existir na tabela local
        }

        logger.success(`[SHOPEE INVOICE] NF-e enviada com sucesso para pedido #${orderSn}`);
        res.status(200).json({
          success: true,
          message: 'NF-e enviada com sucesso à Shopee.',
        });
      } else {
        logger.warn(`[SHOPEE INVOICE] Falha no envio: ${resultado.error}`);
        res.status(400).json({
          success: false,
          message: resultado.error || 'Erro ao enviar NF-e.',
        });
      }
    } catch (error: any) {
      logger.error(`[SHOPEE INVOICE] Erro: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
