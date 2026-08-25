import { inject, injectable } from 'tsyringe';
import axios, { AxiosRequestConfig } from 'axios';
import { TrayTokenRepository } from '../repositories/trayTokenRepository';
import { TrayAuthService } from './trayAuthService';
import { TrayErrorResponse } from '../dto';
import { logger } from '@/shared/utils/logger';
import {
  IntegrationError,
  UnauthorizedIntegrationError,
  RateLimitIntegrationError,
  RefreshTokenExpiredError,
  BadGatewayError,
  NotFoundError,
  ValidationError,
} from '@/shared/errors/AppError';

@injectable()
export class TrayHttpClient {
  constructor(
    @inject(TrayTokenRepository) private readonly tokenRepository: TrayTokenRepository,
    @inject(TrayAuthService) private readonly authService: TrayAuthService,
  ) {}

  private async ensureValidToken(): Promise<{ apiAddress: string; accessToken: string; tokenId: string }> {
    const token = await this.tokenRepository.findActive();
    if (!token) {
      throw new UnauthorizedIntegrationError('Nenhum token Tray ativo encontrado. Faça a autenticação primeiro.');
    }

    const now = new Date();
    const expiresAt = new Date(token.date_expiration_access_token);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    // access_token expira em 3h — renova com folga de 15 minutos.
    if (timeUntilExpiry < 15 * 60 * 1000) {
      logger.auth('Token Tray expirado ou prestes a expirar. Renovando...');
      const refreshed = await this.authService.refreshAccessToken(token.id);
      return { apiAddress: refreshed.api_address, accessToken: refreshed.access_token, tokenId: refreshed.id };
    }

    return { apiAddress: token.api_address, accessToken: token.access_token, tokenId: token.id };
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

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, config);
  }

  private async request<T>(
    method: string,
    url: string,
    config?: AxiosRequestConfig,
    data?: any,
    retries = 3,
    delayMs = 1000,
  ): Promise<T> {
    const { apiAddress, accessToken } = await this.ensureValidToken();

    try {
      const response = await axios.request<T>({
        method,
        url: `https://${apiAddress}${url}`,
        data,
        ...config,
        params: { ...config?.params, access_token: accessToken },
      });

      return response.data;
    } catch (error: any) {
      const errorCode = Number(error.response?.data?.error_code);

      // 1000/1099: token expirado/inválido — tenta renovar e reexecutar uma vez.
      if (errorCode === 1000 || errorCode === 1099 || error.response?.status === 401) {
        logger.auth(`Token Tray rejeitado (error_code=${errorCode || 'n/a'}). Tentando renovar...`);
        try {
          const refreshed = await this.authService.refreshAccessToken();
          const retryResponse = await axios.request<T>({
            method,
            url: `https://${refreshed.api_address}${url}`,
            data,
            ...config,
            params: { ...config?.params, access_token: refreshed.access_token },
          });
          return retryResponse.data;
        } catch (refreshError) {
          if (refreshError instanceof RefreshTokenExpiredError) {
            throw refreshError;
          }
          throw new UnauthorizedIntegrationError('Token Tray inválido e renovação automática falhou.');
        }
      }

      if (error.response?.status === 429 && retries > 0) {
        logger.warn(
          `[TRAY API] Limite de requisições atingido (429) em ${method} ${url}. Aguardando ${delayMs}ms. Tentativas restantes: ${retries}`,
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.request<T>(method, url, config, data, retries - 1, delayMs * 2);
      }

      throw this.mapError(error, errorCode);
    }
  }

  private mapError(error: any, errorCode?: number): Error {
    const status = error.response?.status;
    const data: TrayErrorResponse | undefined = error.response?.data;
    const message = data?.causes?.join(', ') || data?.message || error.message;

    logger.error(`Erro na API Tray [${status}] error_code=${errorCode}`, { message });

    // 1001/1002/1003: loja bloqueada/inativa/cancelada — não é um problema de token.
    if (errorCode === 1001 || errorCode === 1002 || errorCode === 1003) {
      return new UnauthorizedIntegrationError(`Loja Tray indisponível (error_code=${errorCode}): ${message}`);
    }

    switch (status) {
      case 400: return new ValidationError(message, data);
      case 404: return new NotFoundError(`Recurso Tray não encontrado: ${message}`);
      case 422: return new ValidationError(`Dados inválidos para API Tray: ${message}`, data);
      case 429: return new RateLimitIntegrationError();
      case 502:
      case 503:
      case 504:
        return new BadGatewayError(`Serviço Tray indisponível [${status}]: ${message}`);
      default:
        return new IntegrationError(`Erro na integração Tray: ${message}`, { status, error_code: errorCode });
    }
  }
}
