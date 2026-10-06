import { inject, injectable } from 'tsyringe';
import { ShopeeHttpClient } from './shopeeHttpClient';
import { logger } from '@/shared/utils/logger';

export interface ShopeeOrderListItem {
  order_sn: string;
  order_status: string;
  buyer_user_id: number;
  create_time: number;
  update_time: number;
  total_amount: number;
  shipping_carrier: string;
  tracking_number: string;
}

export interface ShopeeOrderDetail {
  order_sn: string;
  order_status: string;
  buyer_user_id: number;
  buyer_username: string;
  create_time: number;
  update_time: number;
  total_amount: number;
  shipping_carrier: string;
  tracking_number: string;
  item_list: Array<{
    item_id: number;
    item_name: string;
    model_id: number;
    model_name: string;
    model_price: number;
    quantity: number;
  }>;
  recipient_address: {
    name: string;
    phone: string;
    town: string;
    district: string;
    city: string;
    state: string;
    zipcode: string;
    full_address: string;
  };
  invoice_data?: {
    invoice_number: string;
    serial_number: string;
    access_key: string;
  };
}

export interface ShopeeTrackingEvent {
  logistics_status: string;
  description: string;
  updateTime: string;
}

export interface ShopeeTrackingHistory {
  order_sn: string;
  logistics_status: string;
  events: ShopeeTrackingEvent[];
}

@injectable()
export class ShopeeOrderService {
  constructor(
    @inject(ShopeeHttpClient) private readonly httpClient: ShopeeHttpClient,
  ) {}

  async listarPedidos(
    timeFrom: number,
    timeTo: number,
    pageSize: number = 50,
    cursor?: string,
    orderStatus?: string,
    timeRangeField: 'create_time' | 'update_time' = 'create_time',
  ): Promise<{ orders: ShopeeOrderListItem[]; more: boolean; nextCursor: string }> {
    logger.info(`[SHOPEE] Listando pedidos de ${new Date(timeFrom * 1000).toISOString()} até ${new Date(timeTo * 1000).toISOString()}`);

    const params: Record<string, any> = {
      time_range_field: timeRangeField,
      time_from: timeFrom,
      time_to: timeTo,
      page_size: pageSize,
      cursor: cursor || '0',
    };

    if (orderStatus) {
      params.order_status = orderStatus;
    }

    const response = await this.httpClient.get<any>('/order/get_order_list', params);

    if (response.error) {
      throw new Error(`Erro Shopee: ${response.message || response.error}`);
    }

    // Todo endpoint v2 da Shopee embrulha os dados reais em "response".
    const data = response.response || {};
    logger.info(`[SHOPEE] ${data.order_list?.length || 0} pedidos encontrados. more=${data.more}`);

    return {
      orders: data.order_list || [],
      more: data.more || false,
      nextCursor: data.next_cursor || '0',
    };
  }

  async buscarDetalhesPedido(orderSnList: string[]): Promise<ShopeeOrderDetail[]> {
    logger.info(`[SHOPEE] Buscando detalhes de ${orderSnList.length} pedido(s): ${orderSnList.join(', ')}`);

    // response_optional_fields precisa ser pedido explicitamente — por padrão a
    // Shopee não devolve shipping_carrier/package_list, mesmo esses campos
    // existindo na interface de resposta documentada.
    const response = await this.httpClient.get<any>('/order/get_order_detail', {
      order_sn_list: orderSnList.join(','),
      response_optional_fields: 'shipping_carrier,package_list',
    });

    if (response.error) {
      throw new Error(`Erro Shopee: ${response.message || response.error}`);
    }

    return response.response?.order_list || [];
  }

  async buscarNumeroRastreio(orderSn: string, packageNumber?: string): Promise<{ trackingNumber: string; shippingCarrier: string }> {
    logger.info(`[SHOPEE] Buscando número de rastreio do pedido ${orderSn}${packageNumber ? ` (package_number=${packageNumber})` : ''}`);

    const params: Record<string, any> = { order_sn: orderSn };
    if (packageNumber) {
      params.package_number = packageNumber;
    }

    const response = await this.httpClient.get<any>('/logistics/get_tracking_number', params);

    if (response.error) {
      throw new Error(`Erro Shopee: ${response.message || response.error}`);
    }

    const data = response.response || {};
    return {
      trackingNumber: data.tracking_number || '',
      shippingCarrier: data.shipping_carrier || '',
    };
  }

  async buscarHistoricoRastreio(orderSn: string, packageNumber?: string): Promise<ShopeeTrackingHistory> {
    logger.info(`[SHOPEE] Buscando histórico de rastreio do pedido ${orderSn}`);

    const params: Record<string, any> = { order_sn: orderSn };
    if (packageNumber) {
      params.package_number = packageNumber;
    }

    const response = await this.httpClient.get<any>('/logistics/get_tracking_info', params);

    if (response.error) {
      throw new Error(`Erro Shopee: ${response.message || response.error}`);
    }

    const data = response.response || {};
    const events: ShopeeTrackingEvent[] = (data.tracking_info || []).map((event: any) => ({
      logistics_status: event.logistics_status,
      description: event.description,
      updateTime: new Date(event.update_time * 1000).toISOString(),
    }));

    return {
      order_sn: data.order_sn || orderSn,
      logistics_status: data.logistics_status,
      events,
    };
  }

  /**
   * Lista os canais logísticos habilitados na loja (v2.logistics.get_channel_list).
   * Diagnóstico — usado pra entender por que um canal específico não aceita
   * batch_ship_order ou não retorna pontos de dropoff/pickup.
   */
  async listarCanaisLogisticos(): Promise<any> {
    logger.info('[SHOPEE] Listando canais logísticos (get_channel_list)');

    const response = await this.httpClient.get<any>('/logistics/get_channel_list');

    if (response.error) {
      throw new Error(`Erro Shopee: ${response.message || response.error}`);
    }

    return response.response;
  }

  /**
   * Lista os endereços de coleta cadastrados na loja (v2.logistics.get_address_list).
   * Diagnóstico — confirma se a loja tem endereço de pickup configurado.
   */
  async listarEnderecosColeta(): Promise<any> {
    logger.info('[SHOPEE] Listando endereços de coleta (get_address_list)');

    const response = await this.httpClient.get<any>('/logistics/get_address_list');

    if (response.error) {
      throw new Error(`Erro Shopee: ${response.message || response.error}`);
    }

    return response.response;
  }
}
