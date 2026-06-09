export interface CreateBlingTokenDTO {
  access_token: string;
  refresh_token: string;
  expires_at?: Date;
  scope?: string;
  token_type?: string;
  access_token_url?: string;
  client_id?: string;
  client_secret?: string;
  active?: boolean;
}

export interface ResponseBlingTokenDTO {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_at: Date | null;
  scope: string | null;
  token_type: string | null;
  access_token_url: string;
  client_id: string;
  client_secret: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateBlingTokenDTO {
  access_token?: string;
  refresh_token?: string;
  expires_at?: Date;
  scope?: string;
  token_type?: string;
  active?: boolean;
}

export interface BlingAuthUrlDTO {
  url: string;
  state: string;
}
