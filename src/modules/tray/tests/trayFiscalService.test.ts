import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../repositories/trayTokenRepository', () => ({
  TrayTokenRepository: class MockTrayTokenRepository {},
}));

import { TrayFiscalService } from '../services/trayFiscalService';

describe('TrayFiscalService', () => {
  let fiscalService: TrayFiscalService;
  let mockHttpClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient = {
      post: vi.fn().mockResolvedValue({ message: 'Created', id: '123' }),
    };
    fiscalService = new TrayFiscalService(mockHttpClient);
  });

  it('deve abortar se a chave de acesso não tiver 44 dígitos', async () => {
    const result = await fiscalService.enviarNFe('123', {
      numero: '82957',
      serie: '1',
      chaveAcesso: '12345',
      dataFaturamento: '2026-09-23',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('44 dígitos');
    expect(mockHttpClient.post).not.toHaveBeenCalled();
  });

  it('deve abortar se faltar número, série ou data', async () => {
    const result = await fiscalService.enviarNFe('123', {
      numero: null,
      serie: '1',
      chaveAcesso: '35260912345678000100550010000829571234567890',
      dataFaturamento: '2026-09-23',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('sem número, série ou data');
    expect(mockHttpClient.post).not.toHaveBeenCalled();
  });

  it('deve enviar OrderInvoice com serie, value e formato correto para a Tray', async () => {
    const chave = '35260912345678000100550010000829571234567890';
    const result = await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: chave,
      dataFaturamento: '2026-09-23T12:00:00Z',
      valor: 199.9,
    });

    expect(result.success).toBe(true);
    expect(mockHttpClient.post).toHaveBeenCalledWith('/orders/308901/invoices', {
      OrderInvoice: {
        number: '82957',
        serie: '1',
        issue_date: '2026-09-23',
        key: chave,
        value: 199.9,
      },
    });
  });

  it('deve extrair valor da tag <vNF> do XML quando valor não for passado diretamente', async () => {
    const chave = '35260912345678000100550010000829571234567890';
    const xml = '<nfeProc><NFe><infNFe><total><ICMSTot><vNF>350.50</vNF></ICMSTot></total></infNFe></NFe></nfeProc>';

    const result = await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: chave,
      dataFaturamento: '2026-09-23',
      xml,
    });

    expect(result.success).toBe(true);
    expect(mockHttpClient.post).toHaveBeenCalledWith('/orders/308901/invoices', {
      OrderInvoice: {
        number: '82957',
        serie: '1',
        issue_date: '2026-09-23',
        key: chave,
        value: 350.5,
      },
    });
  });
});
