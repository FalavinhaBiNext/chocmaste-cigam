import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebhookService } from '../services/webhookService';
import { PedidoWebhookInput } from '../blingWebhook.validator';

vi.mock('@/shared/utils/delay', () => ({ delay: vi.fn().mockResolvedValue(undefined) }));

function buildPedidoBlingData(lojaOverrides?: any) {
  return {
    id: 555,
    numero: 74996,
    numeroLoja: 'LOJA-001',
    data: '2026-09-29',
    total: 2084.90,
    totalProdutos: 2084.90,
    desconto: 0,
    contato: { id: 10, nome: 'Gustavo', tipoPessoa: 'F', numeroDocumento: '08824781926' },
    loja: lojaOverrides || { id: 203345026 },
    situacao: { id: 1, valor: 1 },
    itens: [
      { id: 1, produto: { id: 111 }, descricao: 'Item Teste', valor: 2084.90, quantidade: 1, valorTotal: 2084.90 },
    ],
  };
}

function buildWebhookService(deParaMap: Record<string, string>, pedidoData: any) {
  const eventService = {
    findByPedido: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 'evento-uuid' }),
    markSyncSuccess: vi.fn().mockResolvedValue(undefined),
    markSyncFailure: vi.fn().mockResolvedValue(undefined),
  };
  const pedidoService = {
    findByIdBling: vi.fn().mockRejectedValue(new Error('not found')),
    create: vi.fn().mockImplementation((dto: any) => Promise.resolve({ id: 'pedido-uuid', ...dto })),
    update: vi.fn().mockResolvedValue(undefined),
  };
  const produtoService = {
    findByIdBling: vi.fn().mockResolvedValue({ id: 'produto-uuid' }),
  };
  const pedidoProdutoService = {
    deleteByIdPedido: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
  };
  const transportadoraService = { findByIdBling: vi.fn() };
  const formaPagamentoService = { findByIdBling: vi.fn() };
  const clientesService = {
    findByIdBling: vi.fn().mockResolvedValue({ id: 'cliente-uuid' }),
  };
  const contatosService = { getById: vi.fn() };
  const formaPagamentoBlingService = { getById: vi.fn() };
  const cigamPedidoService = {
    enviarPedido: vi.fn().mockResolvedValue('CIGAM-001'),
  };
  const blingRepository = {
    findByCompanyIdBling: vi.fn().mockResolvedValue(null),
    findByNomeUnidade: vi.fn().mockResolvedValue(null),
  };
  const deParaUnidadesNegocioRepo = {
    findByCompanyIdBling: vi.fn().mockImplementation((key: string) => {
      if (deParaMap[key]) {
        return Promise.resolve({ company_id_bling: key, unidade_negocio: deParaMap[key] });
      }
      return Promise.resolve(null);
    }),
  };
  const configuracoesService = { getEnvioAutomaticoCigam: vi.fn().mockResolvedValue(true) };
  const canalVendaRepository = { findByIdBling: vi.fn().mockResolvedValue(null), findByLocalVenda: vi.fn() };
  const blingHttpClient = {
    getPedido: vi.fn().mockResolvedValue({ data: pedidoData }),
  };

  const service = new WebhookService(
    blingHttpClient as any,
    eventService as any,
    pedidoService as any,
    produtoService as any,
    pedidoProdutoService as any,
    transportadoraService as any,
    formaPagamentoService as any,
    clientesService as any,
    contatosService as any,
    formaPagamentoBlingService as any,
    cigamPedidoService as any,
    blingRepository as any,
    deParaUnidadesNegocioRepo as any,
    configuracoesService as any,
    canalVendaRepository as any,
  );

  return { service, pedidoService, cigamPedidoService, deParaUnidadesNegocioRepo };
}

function buildPayload(companyId: string = 'f46afdc1cc617537a402af81c928bd37'): PedidoWebhookInput {
  return {
    eventId: '550e8400-e29b-41d4-a716-446655440000',
    date: '2026-09-29',
    version: '1',
    event: 'order.created',
    companyId,
    data: {
      id: 555,
      data: '2026-09-29',
      numero: 74996,
      numeroLoja: 'LOJA-001',
      total: 2084.90,
      contato: { id: 10 },
      loja: { id: 203345026 },
    },
  };
}

describe('WebhookService - Resolução de Unidade de Negócio do Pedido Bling', () => {
  const originalEnv = process.env.CIGAM_DEFAULT_UNIDADE_NEGOCIO;

  afterEach(() => {
    process.env.CIGAM_DEFAULT_UNIDADE_NEGOCIO = originalEnv;
  });

  it('deve usar CIGAM_DEFAULT_UNIDADE_NEGOCIO mesmo quando a loja do pedido e o companyId possuírem De-Para', async () => {
    process.env.CIGAM_DEFAULT_UNIDADE_NEGOCIO = '003';

    const pedidoData = buildPedidoBlingData({
      id: 203345026,
      unidadeNegocio: { id: 941369 },
    });

    const deParaMap = {
      '941369': '002',
      'f46afdc1cc617537a402af81c928bd37': '001',
    };

    const { service, pedidoService, cigamPedidoService } = buildWebhookService(deParaMap, pedidoData);

    await service.processarPedidoCriado(buildPayload());

    expect(pedidoService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        unidade_negocio: '003',
      })
    );

    expect(cigamPedidoService.enviarPedido).toHaveBeenCalledWith(
      expect.anything(),
      '003',
      undefined,
      undefined,
      'evento-uuid'
    );
  });

  it('deve seguir sem unidade de negócio quando CIGAM_DEFAULT_UNIDADE_NEGOCIO não estiver configurada', async () => {
    delete process.env.CIGAM_DEFAULT_UNIDADE_NEGOCIO;

    const pedidoData = buildPedidoBlingData({
      id: 203345026,
      unidadeNegocio: { id: 941369 },
    });

    const { service, cigamPedidoService } = buildWebhookService({ '941369': '002' }, pedidoData);

    await service.processarPedidoCriado(buildPayload());

    expect(cigamPedidoService.enviarPedido).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
      undefined,
      undefined,
      'evento-uuid'
    );
  });
});
