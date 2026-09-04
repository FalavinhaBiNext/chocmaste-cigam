import { inject, injectable } from 'tsyringe';
import { TrayHttpClient } from './trayHttpClient';
import { TrayCompleteOrder, TrayOrderListResponse } from '../dto';
import { logger } from '@/shared/utils/logger';

export interface ListarPedidosParams {
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
  /** Formato: aaaa-mm-dd ou aaaa-mm-dd,aaaa-mm-dd (intervalo) */
  modified?: string;
}

@injectable()
export class TrayOrderService {
  constructor(
    @inject(TrayHttpClient) private readonly httpClient: TrayHttpClient,
  ) {}

  /**
   * Lista pedidos com paginação e filtros.
   * GET /orders
   */
  async listarPedidos(params: ListarPedidosParams = {}): Promise<TrayOrderListResponse> {
    logger.info('[TRAY] Listando pedidos', params);

    const response = await this.httpClient.get<TrayOrderListResponse>('/orders', {
      params: {
        status: params.status,
        page: params.page,
        limit: params.limit,
        sort: params.sort,
        modified: params.modified,
      },
    });

    logger.info(`[TRAY] ${response.Orders?.length || 0} pedido(s) encontrado(s) de ${response.paging?.total || 0} total.`);
    return response;
  }

  /**
   * Busca os dados básicos de um pedido (itens vêm só com o id, sem detalhe).
   * GET /orders/:id
   */
  async buscarPedido(orderId: string): Promise<TrayCompleteOrder> {
    return this.httpClient.get<TrayCompleteOrder>(`/orders/${orderId}`);
  }

  /**
   * Busca os dados completos do pedido (cliente, endereço e itens embutidos).
   * GET /orders/:id/complete
   */
  async buscarPedidoCompleto(orderId: string): Promise<TrayCompleteOrder> {
    return this.httpClient.get<TrayCompleteOrder>(`/orders/${orderId}/complete`);
  }
}
