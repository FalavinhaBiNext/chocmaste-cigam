export interface ShopeeTokenResponse {
  access_token: string;
  refresh_token: string;
  expire_in: number;
  request_id: string;
  error: string;
  message: string;
}

export interface ShopeeShopInfo {
  shop_id: number;
  shop_name: string;
  region: string;
  status: string;
  request_id: string;
}

export interface CreateShopeeTokenDTO {
  shop_id: string;
  shop_name: string | null;
  access_token: string;
  refresh_token: string;
  expires_at: Date;
  region: string;
}

export interface ResponseShopeeTokenDTO {
  id: string;
  shop_id: string;
  shop_name: string | null;
  active: boolean;
  region: string | null;
  expires_at: Date | null;
  created_at: Date;
}
