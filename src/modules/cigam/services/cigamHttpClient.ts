import { inject, injectable } from 'tsyringe';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { CigamAuthService } from './cigamAuthService';
import { CigamRepository } from '../repositories/cigamRepository';
import { logger } from '@/shared/utils/logger';
import {
  IntegrationError,
  UnauthorizedIntegrationError,
  NotFoundError,
  BadGatewayError,
  ValidationError
} from '@/shared/errors/AppError';

@injectable()
export class CigamHttpClient {
  private readonly client: AxiosInstance;

  constructor(
    @inject(CigamAuthService) private readonly cigamAuthService: CigamAuthService,
    @inject(CigamRepository) private readonly cigamRepository: CigamRepository
  ) {
    this.client = axios.create({
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async ensureValidHash(ambiente: string): Promise<string> {
    const token = await this.cigamRepository.findByAmbiente(ambiente);

    if (token) {
      const now = new Date();
      const expiresAt = token.expires_at ? new Date(token.expires_at) : null;

      if (expiresAt && expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
        return token.hash;
      }

      logger.auth('Hash Cigam expirado ou prestes a expirar. Reautenticando...');
    }

    const authResult = await this.cigamAuthService.authenticate(ambiente);
    return authResult.hash;
  }

  async get<T>(baseUrl: string, ambiente: string, url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', baseUrl, ambiente, url, config);
  }

  async post<T>(baseUrl: string, ambiente: string, url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('POST', baseUrl, ambiente, url, config, data);
  }

  async put<T>(baseUrl: string, ambiente: string, url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', baseUrl, ambiente, url, config, data);
  }

  async patch<T>(baseUrl: string, ambiente: string, url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PATCH', baseUrl, ambiente, url, config, data);
  }

  async delete<T>(baseUrl: string, ambiente: string, url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', baseUrl, ambiente, url, config);
  }

  private async request<T>(
    method: string,
    baseUrl: string,
    ambiente: string,
    url: string,
    config?: AxiosRequestConfig,
    data?: any
  ): Promise<T> {
    const hash = await this.ensureValidHash(ambiente);

    try {
      const response = await this.client.request<T>({
        method,
        url: `${baseUrl}${url}`,
        data,
        ...config,
        headers: {
          ...config?.headers,
          Authorization: `Bearer ${hash}`
        }
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.auth('Hash Cigam rejeitado (401). Reautenticando...');

        const authResult = await this.cigamAuthService.authenticate(ambiente);

        const retryResponse = await this.client.request<T>({
          method,
          url: `${baseUrl}${url}`,
          data,
          ...config,
          headers: {
            ...config?.headers,
            Authorization: `Bearer ${authResult.hash}`
          }
        });

        return retryResponse.data;
      }

      throw this.mapError(error);
    }
  }

  private mapError(error: any): Error {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = data?.message || data?.error || error.message;

    logger.error(`Erro na API Cigam [${status}]`, { message, data });

    switch (status) {
      case 400: return new ValidationError(message, data);
      case 401: return new UnauthorizedIntegrationError('Não autorizado na API Cigam.');
      case 403: return new UnauthorizedIntegrationError('Acesso negado pela API Cigam.');
      case 404: return new NotFoundError(`Recurso Cigam não encontrado: ${message}`);
      case 502:
      case 503:
      case 504:
        return new BadGatewayError(`Serviço Cigam indisponível [${status}]: ${message}`);
      default:
        return new IntegrationError(`Erro na integração Cigam: ${message}`, { status, data });
    }
  }
}