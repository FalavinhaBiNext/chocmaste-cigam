const SHOPEE_LIVE_HOST = 'https://partner.shopeemobile.com';
const SHOPEE_TEST_HOST = 'https://partner.test-stable.shopeemobile.com';

/**
 * A Shopee usa hosts diferentes para o app em modo "Developing" (Test Partner_id/Key,
 * exige Test Shop) e para o app "Live" (aprovado, lojas reais). Alternar via SHOPEE_ENV.
 */
function getShopeeHost(): string {
  const env = (process.env.SHOPEE_ENV || 'test').toLowerCase();
  return env === 'live' ? SHOPEE_LIVE_HOST : SHOPEE_TEST_HOST;
}

export function getShopeeApiBase(): string {
  return `${getShopeeHost()}/api/v2`;
}

export function getShopeeAuthPartnerUrl(): string {
  return `${getShopeeHost()}/api/v2/shop/auth_partner`;
}

export function getShopeeTokenUrl(): string {
  return `${getShopeeHost()}/api/v2/auth/token/get`;
}

export function getShopeeRefreshUrl(): string {
  return `${getShopeeHost()}/api/v2/auth/access_token/get`;
}
