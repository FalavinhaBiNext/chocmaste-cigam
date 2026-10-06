import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../repositories/shopeeTokenRepository', () => ({
  ShopeeTokenRepository: class MockShopeeTokenRepository {},
}));

import { ShopeeShippingLabelService } from '../services/shopeeShippingLabelService';

describe('ShopeeShippingLabelService — fallback ship_order individual', () => {
  let service: ShopeeShippingLabelService;
  let mockHttpClient: any;
  let mockOrderService: any;

  const batchFalhaCanal = {
    response: {
      result_list: [{
        order_sn: 'ORDER1',
        fail_error: 'logistics_error',
        fail_message: "Sorry you don't have the permission, detail: Sorry this logistics channel can't batch ship order.",
      }],
    },
  };

  const batchFalhaGenerica = {
    error: 'error_param',
    message: 'All failed, please check result_list for detail',
    response: { result_list: [{ order_sn: 'ORDER1', fail_error: 'other_error', fail_message: 'Outro motivo qualquer.' }] },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    delete process.env.SHOPEE_SENDER_NAME;

    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      postBinary: vi.fn(),
    };
    mockOrderService = {
      buscarNumeroRastreio: vi.fn(),
    };

    service = new ShopeeShippingLabelService(mockHttpClient, mockOrderService);
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.SHOPEE_SENDER_NAME;
  });

  it('deve acionar o fallback via dropoff quando batch_ship_order falhar por canal incompatível', async () => {
    process.env.SHOPEE_SENDER_NAME = 'Loja Teste';

    mockHttpClient.get.mockResolvedValue({
      response: {
        info_needed: { dropoff: true },
        dropoff: { branch_list: [{ branch_id: 999, branch_name: 'Ponto Teste' }] },
      },
    });
    mockOrderService.buscarNumeroRastreio.mockResolvedValue({ trackingNumber: 'BR123456789', shippingCarrier: 'Correios' });

    // Interrompe no passo seguinte (create_shipping_document) só pra isolar o teste no fallback.
    mockHttpClient.post.mockImplementation((path: string) => {
      if (path === '/logistics/batch_ship_order') return Promise.resolve(batchFalhaCanal);
      if (path === '/logistics/ship_order') return Promise.resolve({ response: {} });
      if (path === '/logistics/create_shipping_document') return Promise.reject(new Error('parado de propósito'));
      return Promise.reject(new Error(`chamada inesperada: ${path}`));
    });

    const resultado = await service.obterEtiqueta('ORDER1');

    expect(mockHttpClient.get).toHaveBeenCalledWith('/logistics/get_shipping_parameter', { order_sn: 'ORDER1' });
    expect(mockHttpClient.post).toHaveBeenCalledWith('/logistics/ship_order', {
      order_sn: 'ORDER1',
      dropoff: { branch_id: 999, sender_real_name: 'Loja Teste' },
    });
    expect(resultado.success).toBe(false); // parou no create_shipping_document de propósito
    expect(resultado.error).not.toContain('Fallback ship_order individual também falhou');
  });

  it('não deve acionar o fallback quando a falha do batch_ship_order não for de canal incompatível', async () => {
    mockHttpClient.post.mockImplementation((path: string) => {
      if (path === '/logistics/batch_ship_order') return Promise.resolve(batchFalhaGenerica);
      return Promise.reject(new Error(`chamada inesperada: ${path}`));
    });
    mockOrderService.buscarNumeroRastreio.mockResolvedValue({ trackingNumber: '', shippingCarrier: '' });

    const resultadoPromise = service.obterEtiqueta('ORDER1');
    await vi.advanceTimersByTimeAsync(10_000);
    const resultado = await resultadoPromise;

    expect(mockHttpClient.get).not.toHaveBeenCalled();
    expect(resultado.success).toBe(false);
    expect(resultado.error).toContain('Outro motivo qualquer.');
  });

  it('deve reportar erro combinado quando o fallback também falhar (SHOPEE_SENDER_NAME ausente)', async () => {
    mockHttpClient.post.mockImplementation((path: string) => {
      if (path === '/logistics/batch_ship_order') return Promise.resolve(batchFalhaCanal);
      return Promise.reject(new Error(`chamada inesperada: ${path}`));
    });
    mockHttpClient.get.mockResolvedValue({
      response: {
        info_needed: { dropoff: true },
        dropoff: { branch_list: [{ branch_id: 999, branch_name: 'Ponto Teste' }] },
      },
    });
    mockOrderService.buscarNumeroRastreio.mockResolvedValue({ trackingNumber: '', shippingCarrier: '' });

    const resultadoPromise = service.obterEtiqueta('ORDER1');
    await vi.advanceTimersByTimeAsync(10_000);
    const resultado = await resultadoPromise;

    expect(mockHttpClient.post).not.toHaveBeenCalledWith('/logistics/ship_order', expect.anything());
    expect(resultado.success).toBe(false);
    expect(resultado.error).toContain('Fallback ship_order individual também falhou');
    expect(resultado.error).toContain('SHOPEE_SENDER_NAME não configurado');
  });
});
