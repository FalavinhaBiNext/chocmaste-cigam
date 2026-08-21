import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { MercadoLivreAuthService } from '../services/mercadoLivreAuthService';
import { MercadoLivreTokenRepository } from '../repositories/mercadoLivreTokenRepository';
import { MercadoLivreHttpClient } from '../services/mercadoLivreHttpClient';
import { MercadoLivreFiscalService } from '../services/mercadoLivreFiscalService';
import { NotasFiscaisCigamRepository } from '@/modules/notasFiscaisCigam/repositories/notasFiscaisCigamRepository';
import { PedidoService } from '@/modules/pedido/services/pedidoService';
import { logger } from '@/shared/utils/logger';

@injectable()
export class MercadoLivreController {
  constructor(
    @inject(MercadoLivreAuthService) private readonly authService: MercadoLivreAuthService,
    @inject(MercadoLivreTokenRepository) private readonly tokenRepository: MercadoLivreTokenRepository,
    @inject(MercadoLivreHttpClient) private readonly httpClient: MercadoLivreHttpClient,
    @inject(MercadoLivreFiscalService) private readonly fiscalService: MercadoLivreFiscalService,
    @inject(NotasFiscaisCigamRepository) private readonly notasFiscaisRepo: NotasFiscaisCigamRepository,
    @inject(PedidoService) private readonly pedidoService: PedidoService,
  ) {}

  /**
   * Gera a URL de autorização para o usuário redirecionar ao ML.
   * GET /mercado-livre/auth-url
   */
  getAuthUrl = async (_req: Request, res: Response) => {
    logger.route('Endpoint GET /mercado-livre/auth-url chamado');

    const appId = process.env.ML_APP_ID;
    const redirectUri = process.env.ML_REDIRECT_URI;

    if (!appId || !redirectUri) {
      res.status(500).json({
        success: false,
        message: 'ML_APP_ID e ML_REDIRECT_URI não configurados no servidor.',
      });
      return;
    }

    logger.auth('Gerando URL de autorização do Mercado Livre');

    const state = Math.random().toString(36).substring(2, 15);
    const authUrl = this.authService.generateAuthURL(appId, redirectUri, state);

    logger.success('URL de autorização gerada com sucesso', { authUrl });

    res.status(200).json({
      success: true,
      data: { authUrl, state },
    });
  };

  /**
   * Callback OAuth2 - recebe o code e troca por token.
   * GET /mercado-livre/callback?code=xxx&state=xxx
   */
  handleCallback = async (req: Request, res: Response) => {
    logger.route('Endpoint GET /mercado-livre/callback chamado');

    const { code } = req.query;

    if (!code) {
      logger.warn('Callback do Mercado Livre sem código de autorização');
      res.status(400).json({
        success: false,
        message: 'Código de autorização não fornecido.',
      });
      return;
    }

    logger.auth(`Código de autorização recebido: ${String(code).substring(0, 10)}...`);

    const appId = process.env.ML_APP_ID;
    const clientSecret = process.env.ML_CLIENT_SECRET;
    const redirectUri = process.env.ML_REDIRECT_URI;

    if (!appId || !clientSecret || !redirectUri) {
      res.status(500).json({
        success: false,
        message: 'ML_APP_ID, ML_CLIENT_SECRET e ML_REDIRECT_URI não configurados no servidor.',
      });
      return;
    }

    try {
      logger.process('Iniciando troca de código por token');

      const tokenData = await this.authService.exchangeCodeForToken(
        String(code),
        appId,
        clientSecret,
        redirectUri,
      );

      logger.success('Autenticação Mercado Livre concluída', { user_id: tokenData.user_id });

      res.status(200).json({
        success: true,
        message: 'Autenticação Mercado Livre realizada com sucesso.',
        data: {
          user_id: tokenData.user_id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          scope: tokenData.scope,
        },
      });
    } catch (error: any) {
      logger.error(`Erro no callback do Mercado Livre: ${error.message}`);
      res.status(500).json({
        success: false,
        message: `Erro ao autenticar com Mercado Livre: ${error.message}`,
      });
    }
  };

  /**
   * Lista tokens salvos.
   * GET /mercado-livre/tokens
   */
  listTokens = async (_req: Request, res: Response) => {
    const tokens = await this.tokenRepository.findAll();
    // Não retornar os tokens completos por segurança
    const safeTokens = tokens.map(t => ({
      id: t.id,
      user_id_ml: t.user_id_ml,
      nickname: t.nickname,
      scope: t.scope,
      app_id: t.app_id,
      active: t.active,
      expires_at: t.expires_at,
      created_at: t.created_at,
    }));

    res.status(200).json({
      success: true,
      data: safeTokens,
    });
  };

  /**
   * Obtém dados do usuário logado no ML.
   * GET /mercado-livre/me
   */
  getMe = async (_req: Request, res: Response) => {
    try {
      const userData = await this.httpClient.get<any>('/users/me');
      res.status(200).json({
        success: true,
        data: userData,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Busca um pedido pelo ID.
   * GET /mercado-livre/orders/:orderId
   */
  getOrder = async (req: Request, res: Response) => {
    const { orderId } = req.params;
    try {
      const order = await this.httpClient.get<any>(`/orders/${orderId}`);
      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Busca pedidos do usuário com dados completos do comprador.
   * GET /mercado-livre/orders?status=xxx&limit=50
   *
   * O endpoint /orders/search retorna dados do comprador resumidos.
   * Para obter first_name e last_name, é necessário buscar cada
   * pedido individualmente via /orders/{id}.
   */
  listOrders = async (req: Request, res: Response) => {
    const { status, limit } = req.query;
    const limitValue = String(limit || '50');
    try {
      const me = await this.httpClient.get<any>('/users/me');
      let url = `/orders/search?seller=${me.id}&limit=${limitValue}`;
      if (status) {
        url += `&status=${String(status)}`;
      }
      const searchResult = await this.httpClient.get<any>(url);
      const orders: any[] = searchResult.results || [];

      if (orders.length === 0) {
        res.status(200).json({
          success: true,
          data: { results: [], paging: searchResult.paging },
        });
        return;
      }

      // Buscar detalhes completos de cada pedido para obter dados do comprador
      const fullOrders = await Promise.all(
        orders.map(async (order: any) => {
          try {
            return await this.httpClient.get<any>(`/orders/${order.id}`);
          } catch {
            return order; // fallback: retorna o pedido resumido
          }
        }),
      );

      res.status(200).json({
        success: true,
        data: {
          results: fullOrders,
          paging: searchResult.paging,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Remove um token (desconectar conta ML).
   * DELETE /mercado-livre/tokens/:id
   */
  deleteToken = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await this.tokenRepository.deleteById(String(id));
      res.status(200).json({
        success: true,
        message: 'Conta Mercado Livre desconectada com sucesso.',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Ativa um token específico (se múltiplas contas).
   * PATCH /mercado-livre/tokens/:id/activate
   */
  activateToken = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const token = await this.tokenRepository.findByUserId(String(id));
      if (!token) {
        res.status(404).json({
          success: false,
          message: 'Token não encontrado.',
        });
        return;
      }
      await this.tokenRepository.setActive(token.user_id_ml);
      res.status(200).json({
        success: true,
        message: 'Conta Mercado Livre ativada com sucesso.',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Consulta o status de um shipment para verificar se o envio de XML está liberado.
   * GET /mercado-livre/orders/:orderId/shipment-status
   *
   * Busca o pedido no ML para obter o shipment_id, depois consulta o shipment.
   */
  getShipmentStatus = async (req: Request, res: Response) => {
    const { orderId } = req.params;
    try {
      // 1. Buscar pedido no ML para obter shipment_id
      const orderData: any = await this.httpClient.get(`/orders/${orderId}`);
      const shipments = orderData.shipments;

      if (!shipments || shipments.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            orderId: String(orderId),
            shipmentId: null,
            status: null,
            substatus: null,
            readyForInvoice: false,
            substatusHistory: [],
            error: 'Pedido não possui shipments no Mercado Livre.',
          },
        });
        return;
      }

      const shipmentId = String(shipments[0]);

      // Salvar shipping_id no pedido local
      try {
        const pedido = await this.pedidoService.findByNumeroLoja(String(orderId));
        if (pedido && !pedido.shipping_id) {
          await this.pedidoService.update(pedido.id, { shipping_id: shipmentId });
          logger.info(`[ML SHIPMENT] shipping_id ${shipmentId} salvo no pedido ${pedido.id}`);
        }
      } catch {
        // Pedido pode não existir na tabela local
      }

      // 2. Consultar status do shipment
      const shipment = await this.httpClient.get<any>(`/shipments/${shipmentId}`);

      const status = shipment.status;
      const substatus = shipment.substatus;
      const readyForInvoice = status === 'ready_to_ship' && substatus === 'invoice_pending';

      res.status(200).json({
        success: true,
        data: {
          orderId: String(orderId),
          shipmentId: Number(shipmentId),
          status,
          substatus,
          invoiceRequired: shipment.invoice_required ?? null,
          readyForInvoice,
          substatusHistory: shipment.substatus_history || [],
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Envia XML da NF-e para o Mercado Livre.
   * POST /mercado-livre/orders/:orderId/send-invoice
   */
  sendInvoice = async (req: Request, res: Response) => {
    const { orderId } = req.params;
    try {
      // Buscar nota fiscal não enviada para este pedido
      const notas = await this.notasFiscaisRepo.findNotEnviadas();
      const nota = notas.find((n: any) => n.numero_pedido_marketplace === String(orderId));

      if (!nota) {
        res.status(404).json({
          success: false,
          message: `Nenhuma NF-e pendente encontrada para o pedido ML #${orderId}.`,
        });
        return;
      }

      logger.info(`[ML INVOICE] Enviando NF-e ${nota.id} para pedido ML #${orderId}`);

      const resultado = await this.fiscalService.enviarNFe(String(orderId), nota.xml_content);

      if (resultado.success) {
        await this.notasFiscaisRepo.updateEnviadoMarketplace(nota.id, true);

        // Atualizar status_nfe do pedido
        try {
          const pedido = await this.pedidoService.findByIdBling(String(orderId));
          if (pedido) {
            await this.pedidoService.update(pedido.id, { status_nfe: 'enviada' });
          }
        } catch {
          // Pedido pode não existir na tabela local
        }

        logger.success(`[ML INVOICE] NF-e enviada com sucesso. Shipment: ${resultado.shipmentId}`);
        res.status(200).json({
          success: true,
          message: 'NF-e enviada com sucesso ao Mercado Livre.',
          data: { shipmentId: resultado.shipmentId },
        });
      } else {
        logger.warn(`[ML INVOICE] Falha no envio: ${resultado.error}`);
        res.status(400).json({
          success: false,
          message: resultado.error || 'Erro ao enviar NF-e.',
        });
      }
    } catch (error: any) {
      logger.error(`[ML INVOICE] Erro ao enviar NF-e: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
}
