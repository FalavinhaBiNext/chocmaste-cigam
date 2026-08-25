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
