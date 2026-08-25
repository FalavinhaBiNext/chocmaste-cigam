export type IntegrationName = 'bling' | 'mercado_livre' | 'shopee' | 'tray';

export type IntegrationTokenStatus = 'ok' | 'expiring_soon' | 'expired';

export interface IntegrationHealthDTO {
  integration: IntegrationName;
  connected: boolean;
  status: IntegrationTokenStatus;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  label: string | null;
}
