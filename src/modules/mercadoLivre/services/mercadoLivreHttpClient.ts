import { inject, injectable } from 'tsyringe';
import axios, { AxiosRequestConfig } from 'axios';
import { MercadoLivreTokenRepository } from '../repositories/mercadoLivreTokenRepository';
import { MercadoLivreAuthService } from './mercadoLivreAuthService';
import { logger } from '@/shared/utils/logger';

const ML_API_BASE = 'https://api.mercadolivre.com.br';

@injectable()
export class MercadoLivreHttpClient {
  constructor(
    @inject(MercadoLivreTokenRepository) private readonly tokenRepository: MercadoLivreTokenRepository,
    @inject(MercadoLivreAuthService) private readonly authService: MercadoLivreAuthService,
  ) {}

  private async ensureValidToken(): Promise<string> {
    const token = await this.tokenRepository.findActive();
    if (!token) {
      throw new Error('Nenhum token Mercado Livre ativo encontrado. Faça a autenticação primeiro.');
    }

    const now = new Date();
    const expiresAt = new Date(token.expires_at);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    if (timeUntilExpiry < 5 * 60 * 1000) {
      logger.auth('Token Mercado Livre expirado ou prestes a expirar. Renovando...');
      const refreshed = await this.authService.refreshAccessToken(token.refresh_token, token.app_id);
      return refreshed.access_token;
    }

    return token.access_token;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('POST', url, config, data);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', url, config, data);
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PATCH', url, config, data);
  }

  private async request<T>(
    method: string,
    url: string,
    config?: AxiosRequestConfig,
    data?: any,
  ): Promise<T> {
    const accessToken = await this.ensureValidToken();

    try {
      const response = await axios.request<T>({
        method,
        url: `${ML_API_BASE}${url}`,
        data,
        ...config,
        headers: {
          ...config?.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.auth('Token Mercado Livre rejeitado (401). Tentando renovar...');
        const token = await this.tokenRepository.findActive();
        if (token) {
          try {
            const refreshed = await this.authService.refreshAccessToken(token.refresh_token, token.app_id);
            const retryResponse = await axios.request<T>({
              method,
              url: `${ML_API_BASE}${url}`,
              data,
              ...config,
              headers: {
                ...config?.headers,
                Authorization: `Bearer ${refreshed.access_token}`,
              },
            });
            return retryResponse.data;
          } catch {
            throw new Error('Token Mercado Livre inválido e renovação automática falhou.');
          }
        }
        throw new Error('Token Mercado Livre inválido e renovação automática falhou.');
      }

      const message = error.response?.data?.message || error.message;
      throw new Error(`Erro na API Mercado Livre [${error.response?.status}]: ${message}`);
    }
  }
}
