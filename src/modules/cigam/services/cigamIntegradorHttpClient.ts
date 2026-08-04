import { injectable } from 'tsyringe';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from '@/shared/utils/logger';
import { IntegrationError } from '@/shared/errors/AppError';

@injectable()
export class CigamIntegradorHttpClient {
  private client: AxiosInstance | null = null;

  private getClient(): AxiosInstance {
    if (this.client) return this.client;

    const baseURL = process.env.CIGAM_INTEGRADOR_URL;
    if (!baseURL) {
      throw new Error('CIGAM_INTEGRADOR_URL não configurada. Defina a variável de ambiente.');
    }

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    return this.client;
  }

  private getPin(ambiente: string): string {
    const key = ambiente === 'producao'
      ? 'CIGAM_INTEGRADOR_PIN_PRODUCAO'
      : 'CIGAM_INTEGRADOR_PIN_HOMOLOGACAO';
    const pin = process.env[key];
    if (!pin) {
      throw new Error(`PIN do Integrador não configurado para ambiente: ${ambiente}`);
    }
    return pin;
  }

  async post<T>(endpoint: string, payload: Record<string, any>, ambiente: string): Promise<T> {
    const client = this.getClient();
    const pin = this.getPin(ambiente);
    try {
      const response = await client.post<T>(endpoint, { pin, ...payload });
      return response.data;
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.response?.data?.error || error.message;
      logger.error(`Erro no Integrador CIGAM [${status}]`, { endpoint, message });
      throw new IntegrationError(`Erro no Integrador CIGAM: ${message}`);
    }
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const client = this.getClient();
    try {
      const response = await client.get<T>(endpoint, config);
      return response.data;
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.response?.data?.error || error.message;
      logger.error(`Erro ao listar no Integrador CIGAM [${status}]`, { endpoint, message });
      throw new IntegrationError(`Erro ao listar no Integrador CIGAM: ${message}`);
    }
  }
}
