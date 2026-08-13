export interface MercadoLivreTokenDTO {
  id: string;
  user_id_ml: string;
  access_token: string;
  refresh_token: string;
  expires_at: Date;
  scope: string | null;
  token_type: string | null;
  app_id: string;
  nickname: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MercadoLivreTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

export interface MercadoLivreUserResponse {
  id: number;
  nickname: string;
  registration_date: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: {
    area_code: string;
    number: string;
    verified: boolean;
  };
  address: {
    city: string;
    state: string;
  };
  seller_reputation: {
    level_id: string;
  };
}
