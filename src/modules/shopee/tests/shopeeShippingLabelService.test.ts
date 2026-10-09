import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../repositories/shopeeTokenRepository', () => ({
  ShopeeTokenRepository: class MockShopeeTokenRepository {},
}));

import { ShopeeShippingLabelService } from '../services/shopeeShippingLabelService';

const PARAM_DROPOFF = {
  response: {
    info_needed: { dropoff: true },
    dropoff: { branch_list: [{ branch_id: 999, branch_name: 'Ponto Teste' }] },
  },
};

describe('ShopeeShippingLabelService.organizarEnvio', () => {
  let service: ShopeeShippingLabelService;
  let mockHttpClient: any;
  let mockOrderService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SHOPEE_SENDER_NAME;
    mockHttpClient = { get: vi.fn(), post: vi.fn(), postBinary: vi.fn() };
    mockOrderService = {
      buscarNumeroRastreio: vi.fn(),
      buscarDetalhesPedido: vi.fn().mockResolvedValue([{ order_status: 'READY_TO_SHIP', package_list: [] }]),
    };
    service = new ShopeeShippingLabelService(mockHttpClient, mockOrderService);
  });

  afterEach(() => {
    delete process.env.SHOPEE_SENDER_NAME;
  });

  it('usa ship_order (get_shipping_parameter → ship_order) como caminho principal', async () => {
    process.env.SHOPEE_SENDER_NAME = 'Loja Teste';
    mockHttpClient.get.mockResolvedValue(PARAM_DROPOFF);
    mockHttpClient.post.mockResolvedValue({ response: {} });

    const resultado = await service.organizarEnvio('ORDER1');

    expect(resultado).toEqual({ success: true });
    expect(mockHttpClient.get).toHaveBeenCalledWith('/logistics/get_shipping_parameter', { order_sn: 'ORDER1' });
    expect(mockHttpClient.post).toHaveBeenCalledWith('/logistics/ship_order', {
      order_sn: 'ORDER1',
      dropoff: { branch_id: 999, sender_real_name: 'Loja Teste' },
    });
    expect(mockHttpClient.post).not.toHaveBeenCalledWith('/logistics/batch_ship_order', expect.anything());
  });

  it('não reorganiza pedido já organizado (PROCESSED)', async () => {
    mockOrderService.buscarDetalhesPedido.mockResolvedValue([{ order_status: 'PROCESSED', package_list: [] }]);

    const resultado = await service.organizarEnvio('ORDER1');

    expect(resultado).toEqual({ success: true, jaOrganizado: true });
    expect(mockHttpClient.get).not.toHaveBeenCalled();
    expect(mockHttpClient.post).not.toHaveBeenCalled();
  });

  it('recusa sem chamar a Shopee quando o status não permite organizar', async () => {
    mockOrderService.buscarDetalhesPedido.mockResolvedValue([{ order_status: 'CANCELLED', package_list: [] }]);

    const resultado = await service.organizarEnvio('ORDER1');

    expect(resultado.success).toBe(false);
    expect(resultado.error).toContain('CANCELLED');
    expect(mockHttpClient.post).not.toHaveBeenCalled();
  });

  it('cai no batch_ship_order quando o ship_order falha', async () => {
    // Sem SHOPEE_SENDER_NAME o ship_order por dropoff não pode ser montado.
    mockHttpClient.get.mockResolvedValue(PARAM_DROPOFF);
    mockHttpClient.post.mockResolvedValue({ response: { result_list: [{ order_sn: 'ORDER1' }] } });

    const resultado = await service.organizarEnvio('ORDER1');

    expect(resultado).toEqual({ success: true });
    expect(mockHttpClient.post).toHaveBeenCalledWith('/logistics/batch_ship_order', { order_list: [{ order_sn: 'ORDER1' }] });
  });

  it('reporta os dois motivos quando ship_order e batch_ship_order falham', async () => {
    mockHttpClient.get.mockResolvedValue(PARAM_DROPOFF);
    mockHttpClient.post.mockResolvedValue({
      error: 'error_param',
      message: 'All failed, please check result_list for detail',
      response: { result_list: [{ order_sn: 'ORDER1', fail_error: 'logistics_error', fail_message: 'Canal não suporta lote.' }] },
    });

    const resultado = await service.organizarEnvio('ORDER1');

    expect(resultado.success).toBe(false);
    expect(resultado.error).toContain('SHOPEE_SENDER_NAME não configurado');
    expect(resultado.error).toContain('Canal não suporta lote.');
  });
});

describe('ShopeeShippingLabelService.obterEtiqueta', () => {
  let service: ShopeeShippingLabelService;
  let mockHttpClient: any;
  let mockOrderService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    process.env.SHOPEE_SENDER_NAME = 'Loja Teste';
    mockHttpClient = { get: vi.fn().mockResolvedValue(PARAM_DROPOFF), post: vi.fn(), postBinary: vi.fn() };
    mockOrderService = {
      buscarNumeroRastreio: vi.fn().mockResolvedValue({ trackingNumber: 'BR123456789', shippingCarrier: 'Shopee Xpress' }),
      buscarDetalhesPedido: vi.fn().mockResolvedValue([{
        order_status: 'PROCESSED',
        package_list: [{ package_number: 'OFG244945648184026' }],
        shipping_carrier: 'Shopee Xpress',
      }]),
    };
    service = new ShopeeShippingLabelService(mockHttpClient, mockOrderService);
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.SHOPEE_SENDER_NAME;
  });

  it('segue o fluxo completo e baixa o PDF sem reorganizar um pedido já organizado', async () => {
    mockHttpClient.post.mockImplementation((path: string) => {
      if (path === '/logistics/create_shipping_document') return Promise.resolve({ response: { result_list: [{ order_sn: 'ORDER1' }] } });
      if (path === '/logistics/get_shipping_document_result') {
        return Promise.resolve({ response: { result_list: [{ order_sn: 'ORDER1', status: 'READY' }] } });
      }
      return Promise.reject(new Error(`chamada inesperada: ${path}`));
    });
    mockHttpClient.postBinary.mockResolvedValue(Buffer.from('%PDF-1.4'));

    const resultado = await service.obterEtiqueta('ORDER1');

    expect(resultado.success).toBe(true);
    expect(resultado.contentType).toBe('application/pdf');
    expect(mockHttpClient.post).not.toHaveBeenCalledWith('/logistics/ship_order', expect.anything());
    expect(mockHttpClient.post).toHaveBeenCalledWith('/logistics/create_shipping_document', {
      order_list: [{ order_sn: 'ORDER1', tracking_number: 'BR123456789', shipping_document_type: 'NORMAL_AIR_WAYBILL' }],
    });
    expect(mockOrderService.buscarNumeroRastreio).toHaveBeenCalledWith('ORDER1', 'OFG244945648184026');
  });

  it('organiza o envio na impressão quando o pedido ainda está READY_TO_SHIP', async () => {
    mockOrderService.buscarDetalhesPedido.mockResolvedValue([{ order_status: 'READY_TO_SHIP', package_list: [] }]);
    mockHttpClient.post.mockImplementation((path: string) => {
      if (path === '/logistics/ship_order') return Promise.resolve({ response: {} });
      if (path === '/logistics/create_shipping_document') return Promise.reject(new Error('parado de propósito'));
      return Promise.reject(new Error(`chamada inesperada: ${path}`));
    });

    await service.obterEtiqueta('ORDER1');

    expect(mockHttpClient.post).toHaveBeenCalledWith('/logistics/ship_order', expect.objectContaining({ order_sn: 'ORDER1' }));
  });

  it('espera o rastreio por mais tempo e explica o motivo quando ele não chega', async () => {
    mockOrderService.buscarDetalhesPedido.mockResolvedValue([{ order_status: 'READY_TO_SHIP', package_list: [] }]);
    delete process.env.SHOPEE_SENDER_NAME;
    mockHttpClient.post.mockResolvedValue({ error: 'error_param', message: 'Pedido sem pacote' });
    mockOrderService.buscarNumeroRastreio.mockResolvedValue({ trackingNumber: '', shippingCarrier: '' });

    const promessa = service.obterEtiqueta('ORDER1');
    await vi.advanceTimersByTimeAsync(60_000);
    const resultado = await promessa;

    expect(mockOrderService.buscarNumeroRastreio).toHaveBeenCalledTimes(8);
    expect(resultado.success).toBe(false);
    expect(resultado.errorCode).toBe('NOT_PRINTABLE');
    expect(resultado.error).toContain('ainda não atribuiu um código de rastreio');
    expect(resultado.error).toContain('SHOPEE_SENDER_NAME não configurado');
  });

  it('aguarda o documento ficar READY antes de baixar', async () => {
    let consultas = 0;
    mockHttpClient.post.mockImplementation((path: string) => {
      if (path === '/logistics/create_shipping_document') return Promise.resolve({ response: { result_list: [{ order_sn: 'ORDER1' }] } });
      if (path === '/logistics/get_shipping_document_result') {
        consultas += 1;
        const status = consultas < 4 ? 'PROCESSING' : 'READY';
        return Promise.resolve({ response: { result_list: [{ order_sn: 'ORDER1', status }] } });
      }
      return Promise.reject(new Error(`chamada inesperada: ${path}`));
    });
    mockHttpClient.postBinary.mockResolvedValue(Buffer.from('%PDF-1.4'));

    const promessa = service.obterEtiqueta('ORDER1');
    await vi.advanceTimersByTimeAsync(60_000);
    const resultado = await promessa;

    expect(consultas).toBe(4);
    expect(resultado.success).toBe(true);
    expect(mockHttpClient.postBinary).toHaveBeenCalledTimes(1);
  });
});

describe('ShopeeShippingLabelService.verificarEOrganizarEnvios', () => {
  it('classifica cada pedido e só organiza os que estão READY_TO_SHIP', async () => {
    process.env.SHOPEE_SENDER_NAME = 'Loja Teste';
    const mockHttpClient: any = { get: vi.fn().mockResolvedValue(PARAM_DROPOFF), post: vi.fn(), postBinary: vi.fn() };
    // FALHA é recusado tanto no ship_order quanto no plano B (batch_ship_order).
    mockHttpClient.post.mockImplementation((_path: string, body: any) =>
      (body.order_sn ?? body.order_list?.[0]?.order_sn) === 'FALHA'
        ? Promise.resolve({ error: 'logistics_error', message: 'Recusado' })
        : Promise.resolve({ response: {} }),
    );
    const mockOrderService: any = {
      buscarDetalhesPedido: vi.fn().mockResolvedValue([
        { order_sn: 'PRONTO', order_status: 'READY_TO_SHIP', package_list: [{ package_number: 'PKG1' }] },
        { order_sn: 'JA', order_status: 'PROCESSED', package_list: [] },
        { order_sn: 'CANCELADO', order_status: 'CANCELLED', package_list: [] },
        { order_sn: 'FALHA', order_status: 'READY_TO_SHIP', package_list: [] },
      ]),
    };
    const service = new ShopeeShippingLabelService(mockHttpClient, mockOrderService);

    const resultados = await service.verificarEOrganizarEnvios(['PRONTO', 'JA', 'CANCELADO', 'FALHA', 'SUMIU', 'PRONTO']);

    expect(mockOrderService.buscarDetalhesPedido).toHaveBeenCalledWith(['PRONTO', 'JA', 'CANCELADO', 'FALHA', 'SUMIU']);
    const porPedido = Object.fromEntries(resultados.map((r) => [r.orderSn, r.situacao]));
    expect(porPedido).toEqual({
      PRONTO: 'organizado_agora',
      JA: 'ja_organizado',
      CANCELADO: 'ignorado',
      FALHA: 'falha',
      SUMIU: 'nao_encontrado',
    });
    expect(mockHttpClient.post).toHaveBeenCalledWith('/logistics/ship_order', expect.objectContaining({ order_sn: 'PRONTO' }));
    expect(mockHttpClient.post).not.toHaveBeenCalledWith('/logistics/ship_order', expect.objectContaining({ order_sn: 'JA' }));
    delete process.env.SHOPEE_SENDER_NAME;
  });

  it('consulta os status em lotes de 50 pedidos', async () => {
    const mockOrderService: any = { buscarDetalhesPedido: vi.fn().mockResolvedValue([]) };
    const service = new ShopeeShippingLabelService({} as any, mockOrderService);

    await service.verificarEOrganizarEnvios(Array.from({ length: 120 }, (_, i) => `P${i}`));

    expect(mockOrderService.buscarDetalhesPedido).toHaveBeenCalledTimes(3);
    expect(mockOrderService.buscarDetalhesPedido.mock.calls[0][0]).toHaveLength(50);
    expect(mockOrderService.buscarDetalhesPedido.mock.calls[2][0]).toHaveLength(20);
  });
});
