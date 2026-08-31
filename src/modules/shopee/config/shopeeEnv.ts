// A Shopee Open Console para o Brasil usa o gateway regional openplatform.shopee.com.br
// (não o partner.shopeemobile.com global). O partner_id/partner_key é validado contra o
// gateway específico do ambiente, então usar o host errado gera "Wrong sign" mesmo com o
// HMAC calculado corretamente. O sandbox correspondente não tem host próprio para o BR —
// usa o sandbox global.
const SHOPEE_LIVE_HOST = 'https://openplatform.shopee.com.br';
const SHOPEE_TEST_HOST = 'https://openplatform.sandbox.test-stable.shopee.sg';

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
