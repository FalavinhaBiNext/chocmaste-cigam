import { inject, injectable } from 'tsyringe';
import axios from 'axios';
import crypto from 'crypto';
import { ShopeeTokenRepository } from '../repositories/shopeeTokenRepository';
import { ShopeeTokenResponse, ShopeeShopInfo } from '../dto';
import { logger } from '@/shared/utils/logger';
import { getShopeeApiBase, getShopeeAuthPartnerUrl, getShopeeTokenUrl, getShopeeRefreshUrl } from '../config/shopeeEnv';

@injectable()
export class ShopeeAuthService {
  constructor(
    @inject(ShopeeTokenRepository) private readonly tokenRepository: ShopeeTokenRepository,
  ) {}

  /**
   * Gera a URL de autorização para redirecionar o usuário.
   * O fluxo OAuth2 da Shopee é: Authorization Code Grant (Server Side)
   */
  generateAuthURL(partnerId: string, partnerKey: string, redirectUri: string, state?: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const sign = this.generateSign(partnerKey, partnerId, timestamp, path);

    const params = new URLSearchParams({
      partner_id: partnerId,
      redirect: redirectUri,
      timestamp: timestamp.toString(),
      sign,
    });

    if (state) {
      params.append('state', state);
    }

    return `${getShopeeAuthPartnerUrl()}?${params.toString()}`;
  }

  /**
   * Gera a assinatura para as requisições da Shopee.
   * A Shopee requer HMAC-SHA256 para autenticação.
   */
  private generateSign(partnerKey: string, partnerId: string, timestamp: number, path: string): string {
    const baseString = `${partnerId}${path}${timestamp}`;
    return crypto
      .createHmac('sha256', partnerKey)
      .update(baseString)
      .digest('hex');
  }

  /**
   * Troca o authorization_code por access_token e refresh_token.
   * Endpoint: POST https://partner.shopeemobile.com/api/v2/auth/token/get
   */
  async exchangeCodeForToken(
    code: string,
    shopId: string,
    partnerId: string,
    partnerKey: string,
  ): Promise<ShopeeTokenResponse> {
    logger.auth('Trocando authorization code por token na Shopee...');

    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/auth/token/get';
    const sign = this.generateSign(partnerKey, partnerId, timestamp, path);

    const response = await axios.post<ShopeeTokenResponse>(
      getShopeeTokenUrl(),
      {
        code,
        shop_id: parseInt(shopId),
        partner_id: parseInt(partnerId),
      },
      {
        params: {
          partner_id: partnerId,
          timestamp: timestamp,
          sign: sign,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const tokenData = response.data;

    if (tokenData.error) {
      throw new Error(`Erro Shopee: ${tokenData.message || tokenData.error}`);
    }

    // Buscar informações da loja
    let shopName: string | undefined;
    try {
      const shopInfo = await this.getShopInfo(tokenData.access_token, partnerId, partnerKey, shopId);
      shopName = shopInfo.shop_name;
    } catch {
      logger.warn('Não foi possível obter dados da loja Shopee.');
    }

    // Desativar todas as contas existentes antes de salvar a nova
    await this.tokenRepository.deactivateAll();
    logger.auth('Todas as contas Shopee anteriores foram desativadas');

    // Salvar token no banco
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expire_in);

    await this.tokenRepository.create({
      shop_id: shopId,
      shop_name: shopName || null,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      region: 'BR',
    });

    // Ativar este token
    await this.tokenRepository.setActive(shopId);

    logger.success(`Token Shopee salvo com sucesso. Shop ID: ${shopId}, Shop Name: ${shopName}`);
    return tokenData;
  }

  /**
   * Renova o access_token usando o refresh_token.
   * Endpoint: POST https://partner.shopeemobile.com/api/v2/auth/access_token/get
   */
  async refreshAccessToken(refreshToken: string, shopId: string, partnerId: string, partnerKey: string): Promise<ShopeeTokenResponse> {
    logger.auth('Renovando token Shopee via refresh_token...');

    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/auth/access_token/get';
    const sign = this.generateSign(partnerKey, partnerId, timestamp, path);

    const response = await axios.post<ShopeeTokenResponse>(
      getShopeeRefreshUrl(),
      {
        refresh_token: refreshToken,
        shop_id: parseInt(shopId),
        partner_id: parseInt(partnerId),
      },
      {
        params: {
          partner_id: partnerId,
          timestamp: timestamp,
          sign: sign,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const tokenData = response.data;

    if (tokenData.error) {
      throw new Error(`Erro Shopee: ${tokenData.message || tokenData.error}`);
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expire_in);

    // Atualizar token existente
    await this.tokenRepository.updateToken(shopId, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
    });

    logger.success('Token Shopee renovado com sucesso.');
    return tokenData;
  }

  /**
   * Obtém informações da loja.
   */
  async getShopInfo(accessToken: string, partnerId: string, partnerKey: string, shopId: string): Promise<ShopeeShopInfo> {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/get_shop_info';
    const sign = this.generateSign(partnerKey, partnerId, timestamp, path);

    const response = await axios.get<ShopeeShopInfo>(
      `${getShopeeApiBase()}/shop/get_shop_info`,
      {
        params: {
          partner_id: partnerId,
          timestamp: timestamp,
          sign: sign,
          access_token: accessToken,
          shop_id: shopId,
        },
      },
    );

    return response.data;
  }

  /**
   * Obtém a URL de autorização para uma nova loja.
   */
  getAuthUrlForNewShop(partnerId: string, partnerKey: string, redirectUri: string): string {
    return this.generateAuthURL(partnerId, partnerKey, redirectUri);
  }
}
