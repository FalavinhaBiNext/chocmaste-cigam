import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { ShopeeAuthService } from '../services/shopeeAuthService';
import { ShopeeTokenRepository } from '../repositories/shopeeTokenRepository';
import { logger } from '@/shared/utils/logger';
import { ValidationError } from '@/shared/errors/AppError';

@injectable()
export class ShopeeController {
  constructor(
    @inject(ShopeeAuthService) private readonly authService: ShopeeAuthService,
    @inject(ShopeeTokenRepository) private readonly tokenRepository: ShopeeTokenRepository,
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
}
