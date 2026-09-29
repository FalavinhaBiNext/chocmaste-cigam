import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { CigamPedidoService } from '../services/cigamPedidoService';

vi.mock('@/shared/utils/delay', () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('axios');

describe('CigamPedidoService - Idempotência e Retomada', () => {
  let cigamHttpClient: any;
  let cigamClienteService: any;
  let cigamTransportadoraService: any;
  let usuarioCigamService: any;
  let deParaFormasPagamentoRepo: any;
  let deParaProdutosRepo: any;
  let pedidoService: any;
  let eventService: any;
  let service: CigamPedidoService;

  const mockPedidoBling = {
    id: 12345,
    numero: 9876,
    data: '2026-09-29',
    contato: { id: 101 },
    transporte: { contato: { id: 202 }, frete: 25.5 },
    parcelas: [{ formaPagamento: { id: 303 } }],
    itens: [
      { id: 401, descricao: 'Chocolate Barra 100g', quantidade: 2, valor: 15, valorTotal: 30 },
      { id: 402, descricao: 'Bombom Sortido', quantidade: 1, valor: 20, valorTotal: 20 },
    ],
    desconto: 5,
    outrasDespesas: 2,
  };

  beforeEach(() => {
    process.env.CIGAM_HUB_PEDIDO_API_KEY = 'test-api-key';

    cigamHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
    };

    cigamClienteService = {
      obterOuCriarCliente: vi.fn().mockResolvedValue('CLI-CIGAM-01'),
    };

    cigamTransportadoraService = {
      obterOuCriarTransportadora: vi.fn().mockResolvedValue('TRANSP-CIGAM-01'),
    };

    usuarioCigamService = {
      findAll: vi.fn().mockResolvedValue([{ ativo: true, ambiente: 'producao' }]),
      findByEnv: vi.fn().mockResolvedValue({
        url_ambiente: 'https://erp.cigam.test',
        ambiente: 'producao',
      }),
    };

    deParaFormasPagamentoRepo = {
      findByIdBling: vi.fn().mockResolvedValue({ id_cigam: 'PG-01' }),
    };

    deParaProdutosRepo = {
      findByIdBling: vi.fn().mockImplementation(async (idBling: string) => {
        if (idBling === '401') return { id_cigam: 'MAT-401' };
        if (idBling === '402') return { id_cigam: 'MAT-402' };
        return null;
      }),
    };

    pedidoService = {
      findByIdBling: vi.fn().mockResolvedValue({ id: 'local-ped-1', numero_pedido_cigam: null }),
      update: vi.fn().mockResolvedValue(undefined),
    };

    eventService = {
      setEventCigamId: vi.fn().mockResolvedValue(undefined),
      findByPedido: vi.fn().mockResolvedValue({ id: 'event-uuid-1' }),
    };

    vi.mocked(axios.patch).mockResolvedValue({ data: { success: true } });

    service = new CigamPedidoService(
      cigamHttpClient,
      cigamClienteService,
      cigamTransportadoraService,
      usuarioCigamService,
      deParaFormasPagamentoRepo,
      deParaProdutosRepo,
      pedidoService,
      eventService,
    );
  });

  it('novo pedido: cria capa, salva id imediatamente no pedido e no evento, insere itens e executa PATCH', async () => {
    let itemsSaved = false;
    cigamHttpClient.post.mockImplementation(async (_base: string, _env: string, path: string) => {
      if (path === '/API/api/comercial/fa/Pedido/Salvar') {
        return { data: { codigoPedido: 'CIGAM-999' } };
      }
      if (path === '/API/api/comercial/fa/Pedido/SalvarItemPedido') {
        itemsSaved = true;
        return { success: true };
      }
      return {};
    });

    cigamHttpClient.get.mockImplementation(async (_base: string, _env: string, path: string) => {
      if (path === '/API/api/comercial/fa/Pedido/BuscarItensPedido') {
        return itemsSaved ? [{ CodigoMaterial: 'MAT-401' }, { CodigoMaterial: 'MAT-402' }] : [];
      }
      return [];
    });

    const result = await service.enviarPedido(mockPedidoBling, 'UN-01', undefined, null, 'event-uuid-1');

    expect(result).toBe('CIGAM-999');

    // 1. Criou capa
    expect(cigamHttpClient.post).toHaveBeenCalledWith(
      'https://erp.cigam.test',
      'producao',
      '/API/api/comercial/fa/Pedido/Salvar',
      expect.objectContaining({ CodigoCliente: 'CLI-CIGAM-01' })
    );

    // 2. Salvou no pedido local imediatamente
    expect(pedidoService.update).toHaveBeenCalledWith('local-ped-1', { numero_pedido_cigam: 'CIGAM-999' });

    // 3. Salvou no evento imediatamente
    expect(eventService.setEventCigamId).toHaveBeenCalledWith('event-uuid-1', 'CIGAM-999');

    // 4. Inseriu ambos os itens
    expect(cigamHttpClient.post).toHaveBeenCalledWith(
      'https://erp.cigam.test',
      'producao',
      '/API/api/comercial/fa/Pedido/SalvarItemPedido',
      expect.objectContaining({ CodigoPedido: 'CIGAM-999', CodigoMaterial: 'MAT-401' })
    );
    expect(cigamHttpClient.post).toHaveBeenCalledWith(
      'https://erp.cigam.test',
      'producao',
      '/API/api/comercial/fa/Pedido/SalvarItemPedido',
      expect.objectContaining({ CodigoPedido: 'CIGAM-999', CodigoMaterial: 'MAT-402' })
    );

    // 5. Chamou PATCH de frete/desconto/encargos
    expect(axios.patch).toHaveBeenCalledWith(
      'https://erp.cigam.test/hub_pedido/api/pedidos/CIGAM-999',
      expect.objectContaining({ valorFrete: 25.5, valorDesconto: 5, valorEncargos: 2 }),
      expect.anything()
    );
  });

  it('retry com pedido já existente no CIGAM: não recria a capa e não duplica itens se já estiverem presentes', async () => {
    pedidoService.findByIdBling.mockResolvedValue({
      id: 'local-ped-1',
      numero_pedido_cigam: 'CIGAM-EXISTENTE-123',
    });

    cigamHttpClient.get.mockImplementation(async (_base: string, _env: string, path: string) => {
      if (path === '/API/api/comercial/fa/Pedido/BuscarItensPedido') {
        // CIGAM já tem os dois itens cadastrados
        return [{ CodigoMaterial: 'MAT-401' }, { CodigoMaterial: 'MAT-402' }];
      }
      return [];
    });

    const result = await service.enviarPedido(mockPedidoBling, 'UN-01', undefined, 'CIGAM-EXISTENTE-123', 'event-uuid-1');

    expect(result).toBe('CIGAM-EXISTENTE-123');

    // NÃO deve chamar Salvar Capa
    const chamadasPost = cigamHttpClient.post.mock.calls.map((c: any[]) => c[2]);
    expect(chamadasPost).not.toContain('/API/api/comercial/fa/Pedido/Salvar');

    // NÃO deve chamar SalvarItemPedido pois ambos já existem
    expect(chamadasPost).not.toContain('/API/api/comercial/fa/Pedido/SalvarItemPedido');

    // Deve atualizar o PATCH de frete/desconto no pedido existente
    expect(axios.patch).toHaveBeenCalledWith(
      'https://erp.cigam.test/hub_pedido/api/pedidos/CIGAM-EXISTENTE-123',
      expect.objectContaining({ valorFrete: 25.5 }),
      expect.anything()
    );
  });

  it('retry com itens parciais: envia apenas o item que ainda não constava no CIGAM', async () => {
    pedidoService.findByIdBling.mockResolvedValue({
      id: 'local-ped-1',
      numero_pedido_cigam: 'CIGAM-EXISTENTE-123',
    });

    cigamHttpClient.get.mockImplementation(async (_base: string, _env: string, path: string) => {
      if (path === '/API/api/comercial/fa/Pedido/BuscarItensPedido') {
        // Apenas MAT-401 está no CIGAM, MAT-402 está faltando
        return [{ CodigoMaterial: 'MAT-401' }];
      }
      return [];
    });

    const result = await service.enviarPedido(mockPedidoBling, 'UN-01', undefined, 'CIGAM-EXISTENTE-123', 'event-uuid-1');

    expect(result).toBe('CIGAM-EXISTENTE-123');

    // NÃO cria capa
    const chamadasPost = cigamHttpClient.post.mock.calls.map((c: any[]) => c[2]);
    expect(chamadasPost).not.toContain('/API/api/comercial/fa/Pedido/Salvar');

    // Salva APENAS o item MAT-402
    expect(cigamHttpClient.post).toHaveBeenCalledTimes(1);
    expect(cigamHttpClient.post).toHaveBeenCalledWith(
      'https://erp.cigam.test',
      'producao',
      '/API/api/comercial/fa/Pedido/SalvarItemPedido',
      expect.objectContaining({ CodigoPedido: 'CIGAM-EXISTENTE-123', CodigoMaterial: 'MAT-402' })
    );
  });

  it('falha na capa quando CIGAM retorna success: false com HTTP 200 (não usa número do Bling como fallback)', async () => {
    cigamHttpClient.post.mockResolvedValueOnce({
      success: false,
      messages: ['Condição de pagamento não permitida.'],
      data: null,
    });

    await expect(
      service.enviarPedido(mockPedidoBling, 'UN-01', undefined, null, 'event-uuid-1')
    ).rejects.toThrow('CIGAM rejeitou a criação da capa do pedido #9876: Condição de pagamento não permitida.');

    // NÃO deve atualizar o pedido nem o evento com o número do Bling
    expect(pedidoService.update).not.toHaveBeenCalled();
    expect(eventService.setEventCigamId).not.toHaveBeenCalled();
  });

  it('desconsidera código CIGAM registrado se for idêntico ao número do Bling e recria a capa', async () => {
    cigamHttpClient.post.mockImplementation(async (_base: string, _env: string, path: string) => {
      if (path === '/API/api/comercial/fa/Pedido/Salvar') {
        return { success: true, data: { codigoPedido: '000298' } };
      }
      if (path === '/API/api/comercial/fa/Pedido/SalvarItemPedido') {
        return { success: true };
      }
      return {};
    });

    cigamHttpClient.get.mockResolvedValue([
      { CodigoMaterial: 'MAT-401' },
      { CodigoMaterial: 'MAT-402' },
    ]);

    // Passa '9876' (número do Bling) como se fosse o código CIGAM existente
    const result = await service.enviarPedido(mockPedidoBling, 'UN-01', undefined, '9876', 'event-uuid-1');

    expect(result).toBe('000298');

    // DEVE ter chamado a criação da capa
    const chamadasPost = cigamHttpClient.post.mock.calls.map((c: any[]) => c[2]);
    expect(chamadasPost).toContain('/API/api/comercial/fa/Pedido/Salvar');
    expect(pedidoService.update).toHaveBeenCalledWith('local-ped-1', { numero_pedido_cigam: '000298' });
  });

  it('falha no item quando CIGAM retorna success: false no SalvarItemPedido', async () => {
    cigamHttpClient.post.mockImplementation(async (_base: string, _env: string, path: string) => {
      if (path === '/API/api/comercial/fa/Pedido/Salvar') {
        return { success: true, data: { codigoPedido: '000299' } };
      }
      if (path === '/API/api/comercial/fa/Pedido/SalvarItemPedido') {
        return { success: false, messages: ['Material sem saldo em estoque.'] };
      }
      return {};
    });

    await expect(
      service.enviarPedido(mockPedidoBling, 'UN-01', undefined, null, 'event-uuid-1')
    ).rejects.toThrow('Falha ao adicionar item (Material: MAT-401) no pedido CIGAM #000299: Material sem saldo em estoque.');
  });
});
