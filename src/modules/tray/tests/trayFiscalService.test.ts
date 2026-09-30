import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
        xml_danfe: xml,
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

  it('deve retornar o invoiceId retornado pela Tray ao registrar a NF-e', async () => {
    const chave = '35260912345678000100550010000829571234567890';
    const result = await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: chave,
      dataFaturamento: '2026-09-23',
      valor: 100,
    });

    expect(result.success).toBe(true);
    expect(result.invoiceId).toBe('123');
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

describe('TrayFiscalService.atualizarNFe', () => {
  let fiscalService: TrayFiscalService;
  let mockHttpClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient = {
      put: vi.fn().mockResolvedValue({ message: 'Saved', id: '500' }),
    };
    fiscalService = new TrayFiscalService(mockHttpClient);
  });

  it('deve abortar se a chave de acesso não tiver 44 dígitos', async () => {
    const result = await fiscalService.atualizarNFe('308901', '500', {
      numero: '82957',
      serie: '1',
      chaveAcesso: '12345',
      dataFaturamento: '2026-09-23',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('44 dígitos');
    expect(mockHttpClient.put).not.toHaveBeenCalled();
  });

  it('deve enviar PUT /orders/:order_id/invoices/:invoice_id com os dados atualizados', async () => {
    const chave = '35260912345678000100550010000829571234567890';
    const result = await fiscalService.atualizarNFe('308901', '500', {
      numero: '82957',
      serie: '1',
      chaveAcesso: chave,
      dataFaturamento: '2026-09-23',
      valor: 250.75,
    });

    expect(result.success).toBe(true);
    expect(result.invoiceId).toBe('500');
    expect(mockHttpClient.put).toHaveBeenCalledWith('/orders/308901/invoices/500', {
      OrderInvoice: {
        number: '82957',
        serie: '1',
        issue_date: '2026-09-23',
        key: chave,
        value: 250.75,
      },
    });
  });

  it('deve retornar erro se a chamada PUT falhar', async () => {
    mockHttpClient.put = vi.fn().mockRejectedValue(new Error('Nota fiscal não encontrada'));

    const chave = '35260912345678000100550010000829571234567890';
    const result = await fiscalService.atualizarNFe('308901', '999', {
      numero: '82957',
      serie: '1',
      chaveAcesso: chave,
      dataFaturamento: '2026-09-23',
      valor: 100,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('não encontrada');
  });
});

describe('TrayFiscalService — atualização automática 10s após o envio', () => {
  let fiscalService: TrayFiscalService;
  let mockHttpClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockHttpClient = {
      post: vi.fn().mockResolvedValue({ message: 'Created', id: '123' }),
      put: vi.fn().mockResolvedValue({ message: 'Saved', id: '123' }),
    };
    fiscalService = new TrayFiscalService(mockHttpClient);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('não deve chamar o PUT antes de 10 segundos', async () => {
    const chave = '35260912345678000100550010000829571234567890';
    await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: chave,
      dataFaturamento: '2026-09-23',
      valor: 199.9,
    });

    await vi.advanceTimersByTimeAsync(9999);
    expect(mockHttpClient.put).not.toHaveBeenCalled();
  });

  it('deve chamar PUT /orders/:order_id/invoices/:invoice_id 10s após o POST, com os mesmos dados da documentação', async () => {
    const chave = '35260912345678000100550010000829571234567890';
    const result = await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: chave,
      dataFaturamento: '2026-09-23',
      valor: 199.9,
    });

    expect(result.invoiceId).toBe('123');

    await vi.advanceTimersByTimeAsync(10_000);

    expect(mockHttpClient.put).toHaveBeenCalledWith('/orders/308901/invoices/123', {
      OrderInvoice: {
        number: '82957',
        serie: '1',
        issue_date: '2026-09-23',
        key: chave,
        value: 199.9,
      },
    });
  });

  it('não deve agendar atualização se a Tray não retornar um id de nota fiscal', async () => {
    mockHttpClient.post = vi.fn().mockResolvedValue({ message: 'Created' });

    const chave = '35260912345678000100550010000829571234567890';
    await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: chave,
      dataFaturamento: '2026-09-23',
      valor: 100,
    });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(mockHttpClient.put).not.toHaveBeenCalled();
  });

  it('deve logar aviso se a atualização automática falhar, sem lançar exceção', async () => {
    mockHttpClient.put = vi.fn().mockRejectedValue(new Error('Timeout na Tray'));

    const chave = '35260912345678000100550010000829571234567890';
    await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: chave,
      dataFaturamento: '2026-09-23',
      valor: 100,
    });

    await expect(vi.advanceTimersByTimeAsync(10_000)).resolves.not.toThrow();
    expect(mockHttpClient.put).toHaveBeenCalled();
  });
});

