import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntegrationHealthService } from '../services/integrationHealthService';

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

describe('IntegrationHealthService', () => {
  let blingRepository: any;
  let mercadoLivreTokenRepository: any;
  let shopeeTokenRepository: any;
  let trayTokenRepository: any;
  let service: IntegrationHealthService;

  beforeEach(() => {
    blingRepository = { findActive: vi.fn().mockResolvedValue(null) };
    mercadoLivreTokenRepository = { findActive: vi.fn().mockResolvedValue(null) };
    shopeeTokenRepository = { findActive: vi.fn().mockResolvedValue(null) };
    trayTokenRepository = { findActive: vi.fn().mockResolvedValue(null) };
    service = new IntegrationHealthService(
      blingRepository,
      mercadoLivreTokenRepository,
      shopeeTokenRepository,
      trayTokenRepository,
    );
  });

  it('returns connected: false and status: expired for an integration without an active token', async () => {
    const result = await service.getHealth();
    const shopee = result.find(r => r.integration === 'shopee')!;
    expect(shopee.connected).toBe(false);
    expect(shopee.status).toBe('expired');
  });

  it('returns status ok when the access token is comfortably valid', async () => {
    blingRepository.findActive.mockResolvedValue({ expires_at: minutesFromNow(180), nome_unidade: 'Loja Principal' });
    const result = await service.getHealth();
    const bling = result.find(r => r.integration === 'bling')!;
    expect(bling.connected).toBe(true);
    expect(bling.status).toBe('ok');
    expect(bling.label).toBe('Loja Principal');
  });

  it('returns status expiring_soon when the access token expires in under 2h', async () => {
    mercadoLivreTokenRepository.findActive.mockResolvedValue({ expires_at: minutesFromNow(30), nickname: 'minha_loja' });
    const result = await service.getHealth();
    const ml = result.find(r => r.integration === 'mercado_livre')!;
    expect(ml.status).toBe('expiring_soon');
  });

  it('returns status expired when the access token expiration is in the past', async () => {
    shopeeTokenRepository.findActive.mockResolvedValue({ expires_at: minutesFromNow(-10), shop_name: 'Loja Shopee' });
    const result = await service.getHealth();
    const shopee = result.find(r => r.integration === 'shopee')!;
    expect(shopee.status).toBe('expired');
  });

  it('returns refreshTokenExpiresAt: null for integrations that do not track it separately', async () => {
    mercadoLivreTokenRepository.findActive.mockResolvedValue({ expires_at: minutesFromNow(180), nickname: 'minha_loja' });
    const result = await service.getHealth();
    const ml = result.find(r => r.integration === 'mercado_livre')!;
    expect(ml.refreshTokenExpiresAt).toBeNull();
  });

  it('returns a real refreshTokenExpiresAt for Tray', async () => {
    const refreshExpiresAt = daysFromNow(20);
    trayTokenRepository.findActive.mockResolvedValue({
      date_expiration_access_token: minutesFromNow(180),
      date_expiration_refresh_token: refreshExpiresAt,
      store_id: 'loja-tray-1',
    });
    const result = await service.getHealth();
    const tray = result.find(r => r.integration === 'tray')!;
    expect(tray.refreshTokenExpiresAt).toBe(refreshExpiresAt.toISOString());
  });

  it('flags Tray as expiring_soon when only the refresh token is close to expiring', async () => {
    trayTokenRepository.findActive.mockResolvedValue({
      date_expiration_access_token: minutesFromNow(180),
      date_expiration_refresh_token: daysFromNow(3),
      store_id: 'loja-tray-1',
    });
    const result = await service.getHealth();
    const tray = result.find(r => r.integration === 'tray')!;
    expect(tray.status).toBe('expiring_soon');
  });

  it('does not let one integration failure break the others', async () => {
    blingRepository.findActive.mockRejectedValue(new Error('boom'));
    mercadoLivreTokenRepository.findActive.mockResolvedValue({ expires_at: minutesFromNow(180), nickname: 'minha_loja' });

    const result = await service.getHealth();

    const bling = result.find(r => r.integration === 'bling')!;
    const ml = result.find(r => r.integration === 'mercado_livre')!;
    expect(bling.connected).toBe(false);
    expect(ml.connected).toBe(true);
  });

  it('returns one entry per supported integration', async () => {
    const result = await service.getHealth();
    expect(result.map(r => r.integration).sort()).toEqual(['bling', 'mercado_livre', 'shopee', 'tray']);
  });
});
