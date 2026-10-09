import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('../repositories/trayTokenRepository', () => ({
  TrayTokenRepository: class MockTrayTokenRepository {},
}));
vi.mock('axios');

import { TrayHttpClient, getTrayResponse } from '../services/trayHttpClient';

const mockedAxios = vi.mocked(axios, true);

describe('TrayHttpClient - tratamento de erros', () => {
  let httpClient: TrayHttpClient;
  let mockTokenRepo: any;
  let mockAuthService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTokenRepo = {
      findActive: vi.fn().mockResolvedValue({
        id: 'token-123',
        api_address: 'https://api.tray.com.br',
        access_token: 'valid_access_token',
        date_expiration_access_token: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }),
    };
    mockAuthService = {
      refreshAccessToken: vi.fn(),
    };
    httpClient = new TrayHttpClient(mockTokenRepo, mockAuthService);
  });

  it('deve extrair mensagem corretamente quando causes for um array de strings', async () => {
    mockedAxios.request.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          message: 'Validation failed',
          causes: ['Campo X obrigatório', 'Campo Y inválido'],
        },
      },
    });

    await expect(httpClient.post('/test', {})).rejects.toThrow('Campo X obrigatório, Campo Y inválido');
  });

  it('deve extrair mensagem corretamente quando causes for uma string (não quebrar com causes.join)', async () => {
    mockedAxios.request.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          message: 'Unprocessable Entity',
          causes: 'Nota fiscal já vinculada a este pedido',
        },
      },
    });

    await expect(httpClient.post('/test', {})).rejects.toThrow('Nota fiscal já vinculada a este pedido');
  });

  it('deve extrair mensagem corretamente quando causes for um objeto', async () => {
    mockedAxios.request.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          message: 'Bad Request',
          causes: { key: 'Chave de acesso inválida' },
        },
      },
    });

    await expect(httpClient.post('/test', {})).rejects.toThrow('{"key":"Chave de acesso inválida"}');
  });

  it('deve usar data.message quando causes não existir', async () => {
    mockedAxios.request.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          message: 'Erro específico da Tray sem causes',
        },
      },
    });

    await expect(httpClient.post('/test', {})).rejects.toThrow('Erro específico da Tray sem causes');
  });

  it('anexa ao erro o status e o corpo originais devolvidos pela Tray', async () => {
    const data = { message: 'Bad Request', causes: ['Invalid parameter id.'] };
    mockedAxios.request.mockRejectedValueOnce({ response: { status: 400, data } });

    const error = await httpClient.post('/orders/1/invoices', {}).catch((e) => e);

    expect(getTrayResponse(error)).toEqual({ status: 400, data });
  });

  it('send devolve status, corpo e a URL chamada sem o access_token', async () => {
    mockedAxios.request.mockResolvedValueOnce({ status: 201, data: { message: 'Created', id: 9 } });

    const resposta = await httpClient.send('POST', '/orders/309215/invoices', { OrderInvoice: {} });

    expect(resposta).toEqual({
      status: 201,
      data: { message: 'Created', id: 9 },
      url: 'https://api.tray.com.br/orders/309215/invoices',
    });
    expect(resposta.url).not.toContain('access_token');
  });
});
