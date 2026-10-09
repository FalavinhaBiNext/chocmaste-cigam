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

export interface TrayRawResponse<T> {
  status: number;
  data: T;
  /** URL chamada, sem o access_token (que vai em params). */
  url: string;
}

/** Resposta original da Tray anexada aos erros lançados pelo TrayHttpClient. */
export function getTrayResponse(error: unknown): { status: number; data: unknown } | null {
  const response = (error as any)?.trayResponse;
  return response && typeof response.status === 'number' ? response : null;
}

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

  /**
   * Igual a post/put/get, mas devolve também o status HTTP e a URL chamada
   * (sem o access_token) — usado onde a resposta precisa ser registrada, como
   * no envio de NF-e. Em caso de erro, o erro lançado traz `trayResponse`.
   */
  async send<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, data?: any): Promise<TrayRawResponse<T>> {
    return this.requestFull<T>(method, url, undefined, data);
  }

  private async request<T>(method: string, url: string, config?: AxiosRequestConfig, data?: any): Promise<T> {
    const response = await this.requestFull<T>(method, url, config, data);
    return response.data;
  }

  private async requestFull<T>(
    method: string,
    url: string,
    config?: AxiosRequestConfig,
    data?: any,
    retries = 3,
    delayMs = 1000,
  ): Promise<TrayRawResponse<T>> {
    const { apiAddress, accessToken } = await this.ensureValidToken();

    const cleanAddress = apiAddress.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    const fullUrl = `https://${cleanAddress}${cleanUrl}`;

    logger.api(`Chamando ${method} ${fullUrl}`);

    try {
      const response = await axios.request<T>({
        method,
        url: fullUrl,
        data,
        ...config,
        params: { ...config?.params, access_token: accessToken },
      });

      return { status: response.status, data: response.data, url: fullUrl };
    } catch (error: any) {
      const errorCode = Number(error.response?.data?.error_code);

      // 1000/1099: token expirado/inválido — tenta renovar e reexecutar uma vez.
      if (errorCode === 1000 || errorCode === 1099 || error.response?.status === 401) {
        logger.auth(`Token Tray rejeitado (error_code=${errorCode || 'n/a'}). Tentando renovar...`);
        try {
          const refreshed = await this.authService.refreshAccessToken();
          const retryUrl = `https://${refreshed.api_address}${url}`;
          logger.api(`Repetindo ${method} ${retryUrl} após renovar token`);
          const retryResponse = await axios.request<T>({
            method,
            url: retryUrl,
            data,
            ...config,
            params: { ...config?.params, access_token: refreshed.access_token },
          });
          return { status: retryResponse.status, data: retryResponse.data, url: retryUrl };
        } catch (refreshError: any) {
          if (refreshError instanceof RefreshTokenExpiredError) {
            throw refreshError;
          }
          // Se a falha veio da própria requisição repetida, preserva a resposta da Tray.
          if (refreshError?.response) {
            throw this.mapError(refreshError, Number(refreshError.response?.data?.error_code));
          }
          throw new UnauthorizedIntegrationError('Token Tray inválido e renovação automática falhou.');
        }
      }

      if (error.response?.status === 429 && retries > 0) {
        logger.warn(
          `[TRAY API] Limite de requisições atingido (429) em ${method} ${url}. Aguardando ${delayMs}ms. Tentativas restantes: ${retries}`,
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.requestFull<T>(method, url, config, data, retries - 1, delayMs * 2);
      }

      throw this.mapError(error, errorCode);
    }
  }

  private mapError(error: any, errorCode?: number): Error {
    const mapped = this.toAppError(error, errorCode);
    // Anexa a resposta original da Tray (status + corpo) para quem precisar
    // registrá-la — ex.: o log de envio de NF-e pedido pelo suporte da Tray.
    if (error?.response) {
      (mapped as any).trayResponse = { status: error.response.status, data: error.response.data };
    }
    return mapped;
  }

  private toAppError(error: any, errorCode?: number): Error {
    const status = error.response?.status;
    const data: TrayErrorResponse | undefined = error.response?.data;
    const causesText = Array.isArray(data?.causes)
      ? data.causes.join(', ')
      : typeof data?.causes === 'string'
      ? data.causes
      : data?.causes
      ? JSON.stringify(data.causes)
      : undefined;

    const message = causesText || data?.message || error.message;

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
