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

  it('deve atualizar o status do pedido se TRAY_STATUS_FATURADO_ID estiver configurado', async () => {
    process.env.TRAY_STATUS_FATURADO_ID = '15';
    mockHttpClient.put = vi.fn().mockResolvedValue({ message: 'Saved', id: 308901 });

    const chave = '35260912345678000100550010000829571234567890';
    const result = await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: chave,
      dataFaturamento: '2026-09-23',
      valor: 100,
    });

    expect(result.success).toBe(true);
    expect(mockHttpClient.post).toHaveBeenCalledWith('/orders/308901/invoices', expect.any(Object));
    expect(mockHttpClient.put).toHaveBeenCalledWith('/orders/308901', {
      Order: {
        status_id: 15,
      },
    });

    delete process.env.TRAY_STATUS_FATURADO_ID;
  });

  it('não deve quebrar o envio da NF-e se a atualização de status falhar', async () => {
    process.env.TRAY_STATUS_FATURADO_ID = '15';
    mockHttpClient.put = vi.fn().mockRejectedValue(new Error('Status inexistente'));

    const chave = '35260912345678000100550010000829571234567890';
    const result = await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: chave,
      dataFaturamento: '2026-09-23',
      valor: 100,
    });

    expect(result.success).toBe(true);
    expect(mockHttpClient.post).toHaveBeenCalled();
    expect(mockHttpClient.put).toHaveBeenCalled();

    delete process.env.TRAY_STATUS_FATURADO_ID;
  });
});

