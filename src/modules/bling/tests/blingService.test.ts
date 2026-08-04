import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlingService } from '../services/blingService';
import { IntegrationError } from '@/shared/errors/AppError';

describe('BlingService', () => {
  let svc: BlingService;
  let mockOAuth: any;
  let mockRepo: any;

  beforeEach(() => {
    mockOAuth = { generateAuthURL: vi.fn(), exchangeCode: vi.fn(), refreshAccessToken: vi.fn() };
    mockRepo = { findActive: vi.fn(), save: vi.fn(), update: vi.fn() };
    svc = new BlingService(mockOAuth, mockRepo);
  });

  describe('generateAuthURL', () => {
    it('should call OAuth service and return URL', () => {
      mockOAuth.generateAuthURL.mockReturnValue({ url: 'https://bling.com/auth', state: 'abc' });
      const result = svc.generateAuthURL('abc');
      expect(mockOAuth.generateAuthURL).toHaveBeenCalledWith('abc');
      expect(result.url).toBe('https://bling.com/auth');
    });
  });

  describe('handleCallback', () => {
    it('should exchange code', async () => {
      await svc.handleCallback('code-123');
      expect(mockOAuth.exchangeCode).toHaveBeenCalledWith('code-123');
    });
  });

  describe('refreshToken', () => {
    it('should refresh when active token exists', async () => {
      mockRepo.findActive.mockResolvedValue({ id: 'token-1' });
      await svc.refreshToken();
      expect(mockOAuth.refreshAccessToken).toHaveBeenCalledWith('token-1');
    });

    it('should throw when no active token', async () => {
      mockRepo.findActive.mockResolvedValue(null);
      await expect(svc.refreshToken()).rejects.toThrow(IntegrationError);
    });
  });

  describe('manualSaveToken', () => {
    const tokenData = { access_token: 'a', refresh_token: 'r' };

    it('should update existing token', async () => {
      mockRepo.findActive.mockResolvedValue({ id: 'existing-1' });
      mockRepo.update.mockResolvedValue(undefined);
      await svc.manualSaveToken(tokenData as any);
      expect(mockRepo.update).toHaveBeenCalledWith('existing-1', expect.objectContaining({
        access_token: 'a', refresh_token: 'r'
      }));
    });

    it('should save new token when none exists', async () => {
      mockRepo.findActive.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue(undefined);
      await svc.manualSaveToken(tokenData as any);
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('getTokenStatus', () => {
    it('should return unauthenticated when no token', async () => {
      mockRepo.findActive.mockResolvedValue(null);
      mockOAuth.generateAuthURL.mockReturnValue({ url: 'https://auth.url' });
      const status = await svc.getTokenStatus();
      expect(status.authenticated).toBe(false);
      expect(status.authUrl).toBe('https://auth.url');
      expect(status.warning).toContain('Token Bling não encontrado');
    });

    it('should return authenticated when token exists', async () => {
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      mockRepo.findActive.mockResolvedValue({
        id: 'token-1',
        expires_at: futureDate,
      });
      const status = await svc.getTokenStatus();
      expect(status.authenticated).toBe(true);
      expect(status.hoursUntilExpiry).toBeGreaterThan(0);
    });

    it('should flag expired token', async () => {
      const pastDate = new Date(Date.now() - 1000);
      mockRepo.findActive.mockResolvedValue({
        id: 'token-1',
        expires_at: pastDate,
      });
      const status = await svc.getTokenStatus();
      expect(status.needsRefresh).toBe(true);
      expect(status.warning).toContain('expirado');
    });
  });
});
