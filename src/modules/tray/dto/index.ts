export interface TrayTokenDTO {
  id: string;
  store_id: string;
  api_address: string;
  consumer_key: string;
  access_token: string;
  refresh_token: string;
  date_expiration_access_token: Date;
  date_expiration_refresh_token: Date;
  date_activated: Date | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Retorno de POST /auth (Etapa 3 — Gerar Chaves de Acesso).
 * https://developers.tray.com.br/#autorizacao
 */
export interface TrayAuthResponse {
  code: number;
  message: string;
  access_token: string;
  refresh_token: string;
  date_expiration_access_token: string;
  date_expiration_refresh_token: string;
  date_activated: string;
  api_host: string;
  store_id: string;
}

/**
 * Retorno de GET /auth?refresh_token=... (renovação de chave de acesso).
 */
export interface TrayRefreshResponse {
  code: number;
  message: string;
  access_token: string;
  refresh_token: string;
  date_expiration_access_token: string;
  date_expiration_refresh_token: string;
  store_id: string;
}

/**
 * Retorno de erro da API Tray. O campo de código de erro é `error_code`,
 * não `code` — validado em teste real (token inválido → error_code 1099, HTTP 401).
 */
export interface TrayErrorResponse {
  code?: number;
  message?: string;
  error_code?: number;
  causes?: string[];
}

/**
 * Retorno de POST /shipping_labels (cadastro do emissor de etiqueta).
 * https://developers.tray.com.br/#api-de-emissores-de-etiqueta
 */
export interface TrayShippingLabelRegisterResponse {
  message: string;
  id: string;
  code: number;
}

export interface TrayCustomerAddress {
  id: string;
  recipient: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface TrayProductSoldItem {
  id: string;
  product_id: string;
  name: string;
  reference: string;
  quantity: string;
  price: string;
  weight: string;
}

/**
 * Item de pedido na listagem GET /orders — a Tray só retorna o id do produto
 * aqui; os dados completos do item só vêm em GET /orders/:id/complete.
 */
export interface TrayOrderListItem {
  id: string;
  status: string;
  date: string;
  customer_id: string;
  total: string;
  shipment: string;
  shipment_value: string;
  shipment_integrator: string;
  has_shipment: string;
  has_invoice: string;
  has_payment: string;
  printed: string;
  modified: string;
}

export interface TrayOrderListResponse {
  paging: {
    total: number;
    page: number;
    offset: number;
    limit: number;
    maxLimit: number;
  };
  Orders: Array<{ Order: TrayOrderListItem }>;
}

/**
 * Retorno de GET /orders/:id/complete — usado para renderizar a etiqueta.
 * Tipagem parcial: só os campos usados na etiqueta.
 */
export interface TrayCompleteOrder {
  Order: {
    id: string;
    status: string;
    date: string;
    total: string;
    shipment: string;
    shipment_value: string;
    shipment_integrator: string;
    tracking_url: string;
    external_code: string;
    Customer: {
      id: string;
      name: string;
      phone: string;
      cellphone: string;
      CustomerAddresses: Array<{ CustomerAddress: TrayCustomerAddress }>;
    };
    ProductsSold: Array<{ ProductsSold: TrayProductSoldItem }>;
  };
}
