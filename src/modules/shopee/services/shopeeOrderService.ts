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

export interface ShopeeShipmentStatus {
  order_sn: string;
  shipping_carrier: string;
  tracking_number: string;
  logistic_status: string;
  shipping_proof?: string;
  pickup_schedule?: {
    pickup_time_id: string;
    pickup_time: string;
  };
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
  ): Promise<{ orders: ShopeeOrderListItem[]; more: boolean; nextCursor: string }> {
    logger.info(`[SHOPEE] Listando pedidos de ${new Date(timeFrom * 1000).toISOString()} até ${new Date(timeTo * 1000).toISOString()}`);

    const params: Record<string, any> = {
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

    logger.info(`[SHOPEE] ${response.order_list?.length || 0} pedidos encontrados. more=${response.more}`);

    return {
      orders: response.order_list || [],
      more: response.more || false,
      nextCursor: response.next_cursor || '0',
    };
  }

  async buscarDetalhesPedido(orderSnList: string[]): Promise<ShopeeOrderDetail[]> {
    logger.info(`[SHOPEE] Buscando detalhes de ${orderSnList.length} pedido(s): ${orderSnList.join(', ')}`);

    const response = await this.httpClient.get<any>('/order/get_order_detail', {
      order_sn_list: orderSnList.join(','),
    });

    if (response.error) {
      throw new Error(`Erro Shopee: ${response.message || response.error}`);
    }

    return response.order_list || [];
  }

  async buscarStatusEnvio(orderSn: string): Promise<ShopeeShipmentStatus> {
    logger.info(`[SHOPEE] Buscando status de envio do pedido ${orderSn}`);

    const response = await this.httpClient.get<any>('/logistic/get_shipping_parameter', {
      order_sn: orderSn,
    });

    if (response.error) {
      throw new Error(`Erro Shopee: ${response.message || response.error}`);
    }

    const shipping = response.shipping_parameter || {};
    const logistics = shipping.logistic_list || [];
    const selected = logistics.find((l: any) => l.selected) || logistics[0] || {};

    return {
      order_sn: orderSn,
      shipping_carrier: selected.logistic_name || '',
      tracking_number: selected.tracking_number || '',
      logistic_status: selected.logistic_status || 'LOGISTICS_NOT_START',
      shipping_proof: selected.shipping_proof || undefined,
      pickup_schedule: selected.pickup_schedule || undefined,
    };
  }

  async buscarNumeroRastreio(orderSn: string): Promise<{ trackingNumber: string; shippingCarrier: string }> {
    logger.info(`[SHOPEE] Buscando número de rastreio do pedido ${orderSn}`);

    const response = await this.httpClient.get<any>('/logistic/get_tracking_number', {
      order_sn: orderSn,
    });

    if (response.error) {
      throw new Error(`Erro Shopee: ${response.message || response.error}`);
    }

    return {
      trackingNumber: response.tracking_number || '',
      shippingCarrier: response.shipping_carrier || '',
    };
  }
}
