import { inject, injectable } from 'tsyringe';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { BlingRepository } from "../repositories/blingRepository";
import { BlingOAuthService } from "./blingOAuthService";
import { logger } from '@/shared/utils/logger';
import { BlingPedidoResponse } from '../dto/blingPedido.dto';
import { BlingFormaPagamentoResponse } from '../dto';
import {
  IntegrationError,
  UnauthorizedIntegrationError,
  RateLimitIntegrationError,
  BadGatewayError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RefreshTokenExpiredError
} from '@/shared/errors/AppError';

@injectable()
export class BlingHttpClient {
  private readonly client: AxiosInstance;
  private readonly BASE_URL = 'https://api.bling.com.br/Api/v3';

  constructor(
    @inject(BlingRepository) private readonly blingRepository: BlingRepository,
    @inject(BlingOAuthService) private readonly blingOAuthService: BlingOAuthService
  ) {
    this.client = axios.create({
      baseURL: this.BASE_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async ensureValidToken(tokenId?: string): Promise<string> {
    let token;
    if (tokenId) {
      token = await this.blingRepository.findById(tokenId);
    }
    if (!token) {
      token = await this.blingRepository.findActive();
    }
    if (!token) {
      throw new UnauthorizedIntegrationError(
        'Nenhum token Bling ativo encontrado. Faça a autenticação primeiro.'
      );
    }

    const now = new Date();
    const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
    const timeUntilExpiry = expiresAt ? expiresAt.getTime() - now.getTime() : null;

    logger.auth('Verificando validade do token Bling', {
      hasToken: true,
      expiresAt: expiresAt?.toISOString(),
      timeUntilExpiryMs: timeUntilExpiry,
      timeUntilExpiryMinutes: timeUntilExpiry ? Math.round(timeUntilExpiry / 60000) : null,
    });

    if (expiresAt && expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      logger.auth('Token Bling expirado ou prestes a expirar. Renovando...');
      await this.blingOAuthService.refreshAccessToken(token.id);
      const refreshedToken = await this.blingRepository.findActive();
      return refreshedToken!.access_token;
    }

    return token.access_token;
  }

  async get<T>(url: string, config?: AxiosRequestConfig, tokenId?: string): Promise<T> {
    return this.request<T>('GET', url, config, undefined, 3, 1000, tokenId);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig, tokenId?: string): Promise<T> {
    return this.request<T>('POST', url, config, data, 3, 1000, tokenId);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig, tokenId?: string): Promise<T> {
    return this.request<T>('PUT', url, config, data, 3, 1000, tokenId);
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig, tokenId?: string): Promise<T> {
    return this.request<T>('PATCH', url, config, data, 3, 1000, tokenId);
  }

  async getPedido(id: number): Promise<BlingPedidoResponse> {
    return this.get<BlingPedidoResponse>(`/pedidos/vendas/${id}`);
  }

  async getFormaPagamentoById(id: number | string): Promise<BlingFormaPagamentoResponse> {
    return this.get<BlingFormaPagamentoResponse>(`/formapagamento/${id}`);
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
    tokenId?: string
  ): Promise<T> {
    let accessToken: string;
    try {
      accessToken = await this.ensureValidToken(tokenId);
    } catch (error) {
      // Propaga RefreshTokenExpiredError diretamente
      if (error instanceof RefreshTokenExpiredError) {
        throw error;
      }
      throw error;
    }

    try {
      const response = await this.client.request<T>({
        method,
        url,
        data,
        ...config,
        headers: {
          ...config?.headers,
          Authorization: `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.auth('Token Bling rejeitado (401). Tentando renovar...');
        const token = await this.blingRepository.findActive();
        if (token) {
          try {
            await this.blingOAuthService.refreshAccessToken(token.id);
            const refreshedToken = await this.blingRepository.findActive();
            if (refreshedToken) {
              const retryResponse = await this.client.request<T>({
                method,
                url,
                data,
                ...config,
                headers: {
                  ...config?.headers,
                  Authorization: `Bearer ${refreshedToken.access_token}`
                }
              });
              return retryResponse.data;
            }
          } catch (refreshError) {
            // Propaga RefreshTokenExpiredError diretamente
            if (refreshError instanceof RefreshTokenExpiredError) {
              throw refreshError;
            }
            throw new UnauthorizedIntegrationError(
              'Token Bling inválido e renovação automática falhou.'
            );
          }
        }
        throw new UnauthorizedIntegrationError(
          'Token Bling inválido e renovação automática falhou.'
        );
      }

      if (error.response?.status === 429 && retries > 0) {
        const retryAfterHeader = error.response?.headers?.['retry-after'];
        const waitTime = retryAfterHeader
          ? parseInt(retryAfterHeader, 10) * 1000
          : delayMs;

        logger.warn(
          `[BLING API] Limite de requisições atingido (429) em ${method} ${url}. Aguardando ${waitTime}ms antes da retentativa. Tentativas restantes: ${retries}`
        );

        await new Promise((resolve) => setTimeout(resolve, waitTime));

        return this.request<T>(method, url, config, data, retries - 1, delayMs * 2, tokenId);
      }

      throw this.mapError(error);
    }
  }

  private mapError(error: any): Error {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = data?.error?.description || data?.error?.message || data?.error || error.message;

    logger.error(`Erro na API Bling [${status}]`, { message });

    switch (status) {
      case 400: return new ValidationError(message, data);
      case 403: return new UnauthorizedIntegrationError('Acesso negado pela API Bling.');
      case 404: return new NotFoundError(`Recurso Bling não encontrado: ${message}`);
      case 409: return new ConflictError(`Conflito na API Bling: ${message}`);
      case 422: return new ValidationError(`Dados inválidos para API Bling: ${message}`, data);
      case 429: return new RateLimitIntegrationError();
      case 502:
      case 503:
      case 504:
        return new BadGatewayError(`Serviço Bling indisponível [${status}]: ${message}`);
      default:
        return new IntegrationError(`Erro na integração Bling: ${message}`, { status, data });
    }
  }
}
