import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../repositories/trayTokenRepository', () => ({
  TrayTokenRepository: class MockTrayTokenRepository {},
}));

import { TrayFiscalService } from '../services/trayFiscalService';

const CHAVE = '35260912345678000100550010000829571234567890';

/** Mock de httpClient.send: responde como a Tray, com status + corpo + URL sem token. */
const sendOk = (data: unknown, status = 200) =>
  vi.fn().mockImplementation(async (_m: string, path: string) => ({
    status,
    data,
    url: `https://loja.commercesuite.com.br/web_api${path}`,
  }));

/** Erro como o lançado pelo TrayHttpClient, com a resposta original anexada. */
const trayError = (message: string, status: number, data: unknown) =>
  Object.assign(new Error(message), { trayResponse: { status, data } });

describe('TrayFiscalService', () => {
  let fiscalService: TrayFiscalService;
  let mockHttpClient: any;
  let mockOrderService: any;
  let mockLogRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient = {
      send: sendOk({ message: 'Created', id: '123' }, 201),
    };
    mockOrderService = {
      buscarPedidoCompleto: vi.fn(),
    };
    mockLogRepo = { create: vi.fn().mockResolvedValue(undefined) };
    fiscalService = new TrayFiscalService(mockHttpClient, mockOrderService, mockLogRepo);
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
    expect(mockHttpClient.send).not.toHaveBeenCalled();
  });

  it('deve abortar se faltar número, série ou data', async () => {
    const result = await fiscalService.enviarNFe('123', {
      numero: null,
      serie: '1',
      chaveAcesso: CHAVE,
      dataFaturamento: '2026-09-23',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('sem número, série ou data');
    expect(mockHttpClient.send).not.toHaveBeenCalled();
  });

  it('deve enviar OrderInvoice com serie, value e formato correto para a Tray', async () => {
    const result = await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: CHAVE,
      dataFaturamento: '2026-09-23T12:00:00Z',
      valor: 199.9,
    });

    expect(result.success).toBe(true);
    expect(mockHttpClient.send).toHaveBeenCalledWith('POST', '/orders/308901/invoices', {
      OrderInvoice: {
        number: '82957',
        serie: '1',
        issue_date: '2026-09-23',
        key: CHAVE,
        value: 199.9,
      },
    });
  });

  it('deve extrair valor da tag <vNF> do XML quando valor não for passado diretamente', async () => {
    const xml = '<nfeProc><NFe><infNFe><total><ICMSTot><vNF>350.50</vNF></ICMSTot></total></infNFe></NFe></nfeProc>';

    const result = await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: CHAVE,
      dataFaturamento: '2026-09-23',
      xml,
    });

    expect(result.success).toBe(true);
    expect(mockHttpClient.send).toHaveBeenCalledWith('POST', '/orders/308901/invoices', {
      OrderInvoice: {
        number: '82957',
        serie: '1',
        issue_date: '2026-09-23',
        key: CHAVE,
        value: 350.5,
        xml_danfe: xml,
      },
    });
  });

  it('deve atualizar o status do pedido se TRAY_STATUS_FATURADO_ID estiver configurado', async () => {
    process.env.TRAY_STATUS_FATURADO_ID = '15';
    mockHttpClient.put = vi.fn().mockResolvedValue({ message: 'Saved', id: 308901 });

    const result = await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: CHAVE,
      dataFaturamento: '2026-09-23',
      valor: 100,
    });

    expect(result.success).toBe(true);
    expect(mockHttpClient.send).toHaveBeenCalledWith('POST', '/orders/308901/invoices', expect.any(Object));
    expect(mockHttpClient.put).toHaveBeenCalledWith('/orders/308901', {
      Order: {
        status_id: 15,
      },
    });

    delete process.env.TRAY_STATUS_FATURADO_ID;
  });

  it('deve retornar o invoiceId retornado pela Tray ao registrar a NF-e', async () => {
    const result = await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: CHAVE,
      dataFaturamento: '2026-09-23',
      valor: 100,
    });

    expect(result.success).toBe(true);
    expect(result.invoiceId).toBe('123');
  });

  it('não deve quebrar o envio da NF-e se a atualização de status falhar', async () => {
    process.env.TRAY_STATUS_FATURADO_ID = '15';
    mockHttpClient.put = vi.fn().mockRejectedValue(new Error('Status inexistente'));

    const result = await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: CHAVE,
      dataFaturamento: '2026-09-23',
      valor: 100,
    });

    expect(result.success).toBe(true);
    expect(mockHttpClient.send).toHaveBeenCalled();
    expect(mockHttpClient.put).toHaveBeenCalled();

    delete process.env.TRAY_STATUS_FATURADO_ID;
  });

  it('registra o POST com URL sem token, body, status HTTP e resposta da Tray', async () => {
    await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: CHAVE,
      dataFaturamento: '2026-09-23',
      valor: 100,
    });

    expect(mockLogRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      metodo: 'POST',
      origem: 'envio',
      order_id: '308901',
      invoice_id: '123',
      url: 'https://loja.commercesuite.com.br/web_api/orders/308901/invoices',
      request_body: { OrderInvoice: expect.objectContaining({ number: '82957', key: CHAVE }) },
      http_status: 201,
      response_body: { message: 'Created', id: '123' },
      sucesso: true,
    }));
    expect(mockLogRepo.create.mock.calls[0][0].url).not.toContain('access_token');
  });

  it('registra o erro com o status e o corpo devolvidos pela Tray', async () => {
    const corpoErro = { message: 'Bad Request', causes: ['Invalid parameter id.'], code: 400 };
    mockHttpClient.send = vi.fn().mockRejectedValue(trayError('Invalid parameter id.', 400, corpoErro));

    const result = await fiscalService.enviarNFe('309215', {
      numero: '82957',
      serie: '1',
      chaveAcesso: CHAVE,
      dataFaturamento: '2026-09-23',
      valor: 100,
    });

    expect(result.success).toBe(false);
    expect(mockLogRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      metodo: 'POST',
      order_id: '309215',
      http_status: 400,
      response_body: corpoErro,
      sucesso: false,
      erro: 'Invalid parameter id.',
    }));
  });

  it('não interrompe o envio se a gravação do log falhar', async () => {
    mockLogRepo.create.mockRejectedValue(new Error('tabela inexistente'));

    const result = await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: CHAVE,
      dataFaturamento: '2026-09-23',
      valor: 100,
    });

    expect(result.success).toBe(true);
  });
});

describe('TrayFiscalService.atualizarNFe', () => {
  let fiscalService: TrayFiscalService;
  let mockHttpClient: any;
  let mockOrderService: any;
  let mockLogRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient = {
      send: sendOk({ message: 'Saved', id: '500' }),
    };
    mockOrderService = {
      buscarPedidoCompleto: vi.fn(),
    };
    mockLogRepo = { create: vi.fn().mockResolvedValue(undefined) };
    fiscalService = new TrayFiscalService(mockHttpClient, mockOrderService, mockLogRepo);
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
    expect(mockHttpClient.send).not.toHaveBeenCalled();
  });

  it('deve enviar PUT /orders/:order_id/invoices/:invoice_id com os dados atualizados', async () => {
    const result = await fiscalService.atualizarNFe('308901', '500', {
      numero: '82957',
      serie: '1',
      chaveAcesso: CHAVE,
      dataFaturamento: '2026-09-23',
      valor: 250.75,
    });

    expect(result.success).toBe(true);
    expect(result.invoiceId).toBe('500');
    expect(mockHttpClient.send).toHaveBeenCalledWith('PUT', '/orders/308901/invoices/500', {
      number: '82957',
      serie: '1',
      issue_date: '2026-09-23',
      key: CHAVE,
      value: 250.75,
    });
    expect(mockLogRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      metodo: 'PUT',
      origem: 'atualizacao_manual',
      invoice_id: '500',
      http_status: 200,
      sucesso: true,
    }));
  });

  it('deve retornar erro se a chamada PUT falhar', async () => {
    mockHttpClient.send = vi.fn().mockRejectedValue(new Error('Nota fiscal não encontrada'));

    const result = await fiscalService.atualizarNFe('308901', '999', {
      numero: '82957',
      serie: '1',
      chaveAcesso: CHAVE,
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
  let mockOrderService: any;
  let mockLogRepo: any;

  const putCalls = () => mockHttpClient.send.mock.calls.filter((c: any[]) => c[0] === 'PUT');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockHttpClient = {
      send: vi.fn().mockImplementation(async (metodo: string, path: string) => ({
        status: 200,
        data: metodo === 'POST' ? { message: 'Created', id: '123' } : { message: 'Saved', id: '123' },
        url: `https://loja.commercesuite.com.br/web_api${path}`,
      })),
    };
    mockOrderService = {
      buscarPedidoCompleto: vi.fn(),
    };
    mockLogRepo = { create: vi.fn().mockResolvedValue(undefined) };
    fiscalService = new TrayFiscalService(mockHttpClient, mockOrderService, mockLogRepo);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('não deve chamar o PUT antes de 10 segundos', async () => {
    await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: CHAVE,
      dataFaturamento: '2026-09-23',
      valor: 199.9,
    });

    await vi.advanceTimersByTimeAsync(9999);
    expect(putCalls()).toHaveLength(0);
  });

  it('deve chamar PUT /orders/:order_id/invoices/:invoice_id 10s após o POST, com os mesmos dados da documentação', async () => {
    const result = await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: CHAVE,
      dataFaturamento: '2026-09-23',
      valor: 199.9,
    });

    expect(result.invoiceId).toBe('123');

    await vi.advanceTimersByTimeAsync(10_000);

    expect(mockHttpClient.send).toHaveBeenCalledWith('PUT', '/orders/308901/invoices/123', {
      number: '82957',
      serie: '1',
      issue_date: '2026-09-23',
      key: CHAVE,
      value: 199.9,
    });
    expect(mockLogRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      metodo: 'PUT',
      origem: 'atualizacao_automatica',
    }));
  });

  it('não deve agendar atualização se a Tray não retornar um id de nota fiscal', async () => {
    mockHttpClient.send = sendOk({ message: 'Created' });

    await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: CHAVE,
      dataFaturamento: '2026-09-23',
      valor: 100,
    });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(putCalls()).toHaveLength(0);
  });

  it('deve logar aviso se a atualização automática falhar, sem lançar exceção', async () => {
    mockHttpClient.send = vi.fn().mockImplementation(async (metodo: string, path: string) => {
      if (metodo === 'PUT') throw new Error('Timeout na Tray');
      return { status: 201, data: { message: 'Created', id: '123' }, url: path };
    });

    await fiscalService.enviarNFe('308901', {
      numero: '82957',
      serie: '1',
      chaveAcesso: CHAVE,
      dataFaturamento: '2026-09-23',
      valor: 100,
    });

    await expect(vi.advanceTimersByTimeAsync(10_000)).resolves.not.toThrow();
    expect(putCalls()).toHaveLength(1);
  });
});

describe('TrayFiscalService.listarLogs', () => {
  it('converte os bodies de volta para JSON e resume o XML por padrão', async () => {
    const xml = '<nfeProc>...</nfeProc>';
    const logRepo = {
      findByOrderId: vi.fn().mockResolvedValue([{
        id: 'log-1',
        created_at: new Date('2026-10-09T10:00:00Z'),
        metodo: 'POST',
        origem: 'envio',
        order_id: '309215',
        invoice_id: null,
        url: 'https://loja/web_api/orders/309215/invoices',
        http_status: 400,
        sucesso: false,
        erro: 'Invalid parameter id.',
        duracao_ms: 320,
        request_body: JSON.stringify({ OrderInvoice: { number: '1', xml_danfe: xml } }),
        response_body: JSON.stringify({ message: 'Bad Request' }),
      }]),
    };
    const service = new TrayFiscalService({} as any, {} as any, logRepo as any);

    const [log] = await service.listarLogs('309215') as any[];
    expect(logRepo.findByOrderId).toHaveBeenCalledWith('309215', 50);
    expect(log.response_body).toEqual({ message: 'Bad Request' });
    expect(log.request_body.OrderInvoice.number).toBe('1');
    expect(log.request_body.OrderInvoice.xml_danfe).toContain('xml omitido');

    const [comXml] = await service.listarLogs('309215', true) as any[];
    expect(comXml.request_body.OrderInvoice.xml_danfe).toBe(xml);
  });
});
