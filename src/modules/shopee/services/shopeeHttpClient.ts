import { inject, injectable } from 'tsyringe';
import axios, { AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { ShopeeTokenRepository } from '../repositories/shopeeTokenRepository';
import { ShopeeAuthService } from './shopeeAuthService';
import { logger } from '@/shared/utils/logger';

const SHOPEE_API_BASE = 'https://partner.shopeemobile.com/api/v2';

@injectable()
export class ShopeeHttpClient {
  constructor(
    @inject(ShopeeTokenRepository) private readonly tokenRepository: ShopeeTokenRepository,
    @inject(ShopeeAuthService) private readonly authService: ShopeeAuthService,
  ) {}

  private generateSign(partnerKey: string, partnerId: string, timestamp: number, path: string): string {
    const baseString = `${partnerId}${path}${timestamp}`;
    return crypto
      .createHmac('sha256', partnerKey)
      .update(baseString)
      .digest('hex');
  }

  private async getAuthParams(): Promise<{
    partnerId: string;
    partnerKey: string;
    shopId: string;
    accessToken: string;
  }> {
    const partnerId = process.env.SHOPEE_PARTNER_ID;
    const partnerKey = process.env.SHOPEE_PARTNER_KEY;

    if (!partnerId || !partnerKey) {
      throw new Error('SHOPEE_PARTNER_ID e SHOPEE_PARTNER_KEY não configurados no servidor.');
    }

    const token = await this.tokenRepository.findActive();
    if (!token) {
      throw new Error('Nenhum token Shopee ativo encontrado. Faça a autenticação primeiro.');
    }

    // Verificar se o token está expirado e renovar se necessário
    const now = new Date();
    const expiresAt = token.expires_at ? new Date(token.expires_at) : new Date(0);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    if (timeUntilExpiry < 5 * 60 * 1000) {
      logger.auth('Token Shopee expirado ou prestes a expirar. Renovando...');
      try {
        await this.authService.refreshAccessToken(
          token.refresh_token,
          token.shop_id,
          partnerId,
          partnerKey,
        );
        // Buscar token atualizado
        const updatedToken = await this.tokenRepository.findActive();
        if (!updatedToken) {
          throw new Error('Token Shopee não encontrado após renovação.');
        }
        return {
          partnerId,
          partnerKey,
          shopId: updatedToken.shop_id,
          accessToken: updatedToken.access_token,
        };
      } catch (error: any) {
        logger.error(`Falha ao renovar token Shopee: ${error.message}`);
        throw new Error(`Token Shopee expirado e renovação falhou: ${error.message}`);
      }
    }

    return {
      partnerId,
      partnerKey,
      shopId: token.shop_id,
      accessToken: token.access_token,
    };
  }

  async get<T>(path: string, extraParams?: Record<string, any>): Promise<T> {
    const { partnerId, partnerKey, shopId, accessToken } = await this.getAuthParams();
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.generateSign(partnerKey, partnerId, timestamp, path);

    const params = {
      partner_id: partnerId,
      timestamp,
      sign,
      access_token: accessToken,
      shop_id: shopId,
      ...extraParams,
    };

    try {
      const response = await axios.get<T>(`${SHOPEE_API_BASE}${path}`, { params });
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.error;
      throw new Error(`Erro na API Shopee [${errorCode}]: ${errorMsg}`);
    }
  }

  async post<T>(path: string, body?: any, extraParams?: Record<string, any>): Promise<T> {
    const { partnerId, partnerKey, shopId, accessToken } = await this.getAuthParams();
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.generateSign(partnerKey, partnerId, timestamp, path);

    const params = {
      partner_id: partnerId,
      timestamp,
      sign,
      access_token: accessToken,
      shop_id: shopId,
      ...extraParams,
    };

    try {
      const response = await axios.post<T>(`${SHOPEE_API_BASE}${path}`, body, { params });
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.error;
      throw new Error(`Erro na API Shopee [${errorCode}]: ${errorMsg}`);
    }
  }
}
