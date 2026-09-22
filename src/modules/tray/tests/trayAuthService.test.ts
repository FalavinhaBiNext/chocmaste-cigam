import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('../repositories/trayTokenRepository', () => ({
  TrayTokenRepository: class MockTrayTokenRepository {},
}));
vi.mock('axios');

import { TrayAuthService } from '../services/trayAuthService';

const mockedAxios = vi.mocked(axios, true);

describe('TrayAuthService', () => {
  let authService: TrayAuthService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TRAY_CONSUMER_KEY = 'mock_consumer_key';
    process.env.TRAY_CONSUMER_SECRET = 'mock_consumer_secret';
    process.env.TRAY_CALLBACK_URL = 'https://api-chocmaster.falavinhanext.tec.br/api/v1/tray/callback';

    mockRepo = {
      deactivateAll: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue({} as any),
      setActive: vi.fn().mockResolvedValue(undefined),
      findByStoreId: vi.fn().mockResolvedValue({
        id: 'token-uuid',
        store_id: '1501140',
        api_address: 'lojatesteintegracaotray01.corpsuite.com.br/web_api',
        access_token: 'acc_token_123',
        refresh_token: 'ref_token_456',
        active: true,
      }),
      findActive: vi.fn().mockResolvedValue({
        id: 'token-uuid',
        store_id: '1501140',
        api_address: 'lojatesteintegracaotray01.corpsuite.com.br/web_api',
        access_token: 'acc_token_123',
        refresh_token: 'ref_token_456',
        active: true,
      }),
      findById: vi.fn().mockResolvedValue({
        id: 'token-uuid',
        store_id: '1501140',
        api_address: 'lojatesteintegracaotray01.corpsuite.com.br/web_api',
        access_token: 'acc_token_123',
        refresh_token: 'ref_token_456',
        active: true,
      }),
      updateTokens: vi.fn().mockResolvedValue(undefined),
    };

    authService = new TrayAuthService(mockRepo);
  });

  describe('generateAuthURL', () => {
    it('deve gerar a URL de autorização correta para a loja Tray', () => {
      const url = authService.generateAuthURL('chocmaster.com.br');
      expect(url).toContain('https://chocmaster.com.br/auth.php');
      expect(url).toContain('response_type=code');
      expect(url).toContain('consumer_key=mock_consumer_key');
      expect(url).toContain(encodeURIComponent('https://api-chocmaster.falavinhanext.tec.br/api/v1/tray/callback'));
    });

    it('deve normalizar domínios com https:// e barras finais', () => {
      const url = authService.generateAuthURL('https://chocmaster.com.br/');
      expect(url).toContain('https://chocmaster.com.br/auth.php');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('deve trocar code por tokens e salvar no banco de dados', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          code: 201,
          message: 'Created tokens',
          access_token: 'acc_token_123',
          refresh_token: 'ref_token_456',
          date_expiration_access_token: '2026-09-21 18:00:00',
          date_expiration_refresh_token: '2026-10-21 15:00:00',
          date_activated: '2026-09-21 15:00:00',
          store_id: '1501140',
        },
      });

      const token = await authService.exchangeCodeForToken(
        'lojatesteintegracaotray01.corpsuite.com.br/web_api',
        'sample_code',
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://lojatesteintegracaotray01.corpsuite.com.br/web_api/auth',
        {
          consumer_key: 'mock_consumer_key',
          consumer_secret: 'mock_consumer_secret',
          code: 'sample_code',
        },
        expect.any(Object),
      );

      expect(mockRepo.deactivateAll).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockRepo.setActive).toHaveBeenCalledWith('1501140');
      expect(token.store_id).toBe('1501140');
    });
  });

  describe('refreshAccessToken', () => {
    it('deve renovar access_token e atualizar no banco de dados', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          code: 200,
          message: 'Refreshed tokens',
          access_token: 'new_acc_token',
          refresh_token: 'new_ref_token',
          date_expiration_access_token: '2026-09-21 21:00:00',
          date_expiration_refresh_token: '2026-10-21 18:00:00',
          store_id: '1501140',
        },
      });

      mockRepo.findById = vi
        .fn()
        .mockResolvedValueOnce({
          id: 'token-uuid',
          store_id: '1501140',
          api_address: 'lojatesteintegracaotray01.corpsuite.com.br/web_api',
          access_token: 'acc_token_123',
          refresh_token: 'ref_token_456',
          active: true,
        })
        .mockResolvedValueOnce({
          id: 'token-uuid',
          store_id: '1501140',
          api_address: 'lojatesteintegracaotray01.corpsuite.com.br/web_api',
          access_token: 'new_acc_token',
          refresh_token: 'new_ref_token',
          active: true,
        });

      const token = await authService.refreshAccessToken('token-uuid');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://lojatesteintegracaotray01.corpsuite.com.br/web_api/auth',
        {
          params: { refresh_token: 'ref_token_456' },
          headers: { Accept: 'application/json' },
          timeout: 15000,
        },
      );

      expect(mockRepo.updateTokens).toHaveBeenCalledWith(
        'token-uuid',
        expect.objectContaining({
          access_token: 'new_acc_token',
          refresh_token: 'new_ref_token',
        }),
      );

      expect(token.access_token).toBe('new_acc_token');
    });
  });
});
