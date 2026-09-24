import { inject, injectable } from 'tsyringe';
import axios, { AxiosRequestConfig } from 'axios';
import { MercadoLivreTokenRepository } from '../repositories/mercadoLivreTokenRepository';
import { MercadoLivreAuthService } from './mercadoLivreAuthService';
import { logger } from '@/shared/utils/logger';

const ML_API_BASE = 'https://api.mercadolibre.com';

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
      try {
        const refreshed = await this.authService.refreshAccessToken(token.refresh_token, token.app_id);
        return refreshed.access_token;
      } catch (error: any) {
        logger.error(`Falha ao renovar token ML: ${error.message}`);
        throw new Error(`Token ML expirado e renovação falhou: ${error.message}. Faça login novamente.`);
      }
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

  /**
   * Busca um pedido individual (/orders/:id) ou pacote/carrinho (/packs/:id).
   * No Mercado Livre, quando o cliente compra mais de um item ou pelo carrinho,
   * o identificador recebido é o pack_id. Se buscar em /orders/:id dá 404,
   * mas em /packs/:id retorna os dados do pacote com o shipment.
   */
  async getOrderOrPack(id: string): Promise<{
    type: 'order' | 'pack';
    data: any;
    shipmentId: string | null;
    rawOrderId?: string;
  }> {
    // 1. Tenta buscar como Order simples
    try {
      const orderData: any = await this.get<any>(`/orders/${id}`);
      const shipmentId = orderData.shipping?.id ? String(orderData.shipping.id) : null;
      return {
        type: 'order',
        data: orderData,
        shipmentId,
        rawOrderId: orderData.id ? String(orderData.id) : id,
      };
    } catch (orderError: any) {
      const is404 =
        orderError.message?.includes('[404]') ||
        orderError.message?.includes('not found') ||
        orderError.message?.includes('Order do not exists');

      if (is404) {
        logger.info(
          `[ML CLIENT] Identificador #${id} não encontrado em /orders. Tentando como pacote em /packs/${id}...`
        );
        try {
          const packData: any = await this.get<any>(`/packs/${id}`);
          const shipmentId = packData.shipment?.id ? String(packData.shipment.id) : null;
          const firstOrderId =
            packData.orders && packData.orders.length > 0 ? String(packData.orders[0].id) : undefined;

          logger.info(
            `[ML CLIENT] Pacote #${id} encontrado com sucesso! Shipment: ${shipmentId}, Pedido filho: ${firstOrderId}`
          );

          return {
            type: 'pack',
            data: packData,
            shipmentId,
            rawOrderId: firstOrderId,
          };
        } catch (packError: any) {
          logger.error(
            `[ML CLIENT] Identificador #${id} também não foi encontrado em /packs: ${packError.message}`
          );
          throw orderError;
        }
      }
      throw orderError;
    }
  }
}
