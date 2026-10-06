import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

vi.mock('../repositories/shopeeTokenRepository', () => ({
  ShopeeTokenRepository: class MockShopeeTokenRepository {},
}));

import { ShopeeHttpClient } from '../services/shopeeHttpClient';

describe('ShopeeHttpClient.postBinary', () => {
  let httpClient: ShopeeHttpClient;
  let mockTokenRepository: any;
  let mockAuthService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SHOPEE_PARTNER_ID = '123';
    process.env.SHOPEE_PARTNER_KEY = 'chave-secreta';

    mockTokenRepository = {
      findActive: vi.fn().mockResolvedValue({
        shop_id: '456',
        access_token: 'token-valido',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }),
    };
    mockAuthService = {
      refreshAccessToken: vi.fn(),
    };

    httpClient = new ShopeeHttpClient(mockTokenRepository, mockAuthService);
  });

  it('deve retornar o buffer quando a resposta começa com o cabeçalho %PDF-', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4\n%fake pdf content');
    vi.mocked(axios.post).mockResolvedValue({ data: pdfBuffer });

    const result = await httpClient.postBinary('/logistics/download_shipping_document', {});

    expect(result.toString('latin1').startsWith('%PDF-')).toBe(true);
  });

  it('deve lançar erro com a mensagem da Shopee quando a resposta 200 não é um PDF (corpo JSON de erro)', async () => {
    const errorBody = Buffer.from(JSON.stringify({ error: 'document_not_ready', message: 'Documento ainda não está pronto.' }));
    vi.mocked(axios.post).mockResolvedValue({ data: errorBody });

    await expect(
      httpClient.postBinary('/logistics/download_shipping_document', {})
    ).rejects.toThrow('Erro na API Shopee [document_not_ready]: Documento ainda não está pronto.');
  });

  it('deve lançar erro genérico quando a resposta 200 não é PDF nem JSON reconhecível', async () => {
    const garbage = Buffer.from('conteúdo inesperado qualquer');
    vi.mocked(axios.post).mockResolvedValue({ data: garbage });

    await expect(
      httpClient.postBinary('/logistics/download_shipping_document', {})
    ).rejects.toThrow('Resposta da Shopee não é um PDF válido.');
  });
});
