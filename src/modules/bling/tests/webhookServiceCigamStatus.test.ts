import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookService } from '../services/webhookService';
import { PedidoWebhookInput } from '../blingWebhook.validator';

vi.mock('@/shared/utils/delay', () => ({ delay: vi.fn().mockResolvedValue(undefined) }));

function buildPedidoBlingData() {
  return {
    id: 555,
    numero: 1001,
    numeroLoja: 'LOJA-001',
    data: '2026-08-25',
    total: 250,
    totalProdutos: 250,
    desconto: 0,
    contato: { id: 10, nome: 'Cliente Teste', tipoPessoa: 'F', numeroDocumento: '12345678900' },
    loja: { id: 999 },
    situacao: { id: 1, valor: 1 },
    itens: [
      { id: 1, produto: { id: 111 }, descricao: 'Item Teste', valor: 10, quantidade: 1, valorTotal: 10 },
    ],
  };
}

function buildWebhookService(overrides: { enviarPedido: () => Promise<string | null> }) {
  const eventService = {
    findByPedido: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 'evento-uuid' }),
    markSyncSuccess: vi.fn().mockResolvedValue(undefined),
    markSyncFailure: vi.fn().mockResolvedValue(undefined),
  };
  const pedidoService = {
    findByIdBling: vi.fn().mockRejectedValue(new Error('not found')),
    create: vi.fn().mockResolvedValue({ id: 'pedido-uuid' }),
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
  const cigamPedidoService = { enviarPedido: vi.fn(overrides.enviarPedido) };
  const blingRepository = { findByCompanyIdBling: vi.fn().mockResolvedValue(null) };
  const deParaUnidadesNegocioRepo = { findByCompanyIdBling: vi.fn().mockResolvedValue(null) };
  const configuracoesService = { getEnvioAutomaticoCigam: vi.fn().mockResolvedValue(true) };
  const canalVendaRepository = { findByIdBling: vi.fn().mockResolvedValue(null), findByLocalVenda: vi.fn() };
  const blingHttpClient = {
    getPedido: vi.fn().mockResolvedValue({ data: buildPedidoBlingData() }),
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

  return { service, eventService, cigamPedidoService };
}

function buildPayload(): PedidoWebhookInput {
  return {
    eventId: '550e8400-e29b-41d4-a716-446655440000',
    date: '2026-08-25',
    version: '1',
    event: 'order.created',
    companyId: 'company-1',
    data: {
      id: 555,
      data: '2026-08-25',
      numero: 1001,
      numeroLoja: 'LOJA-001',
      total: 250,
      contato: { id: 10 },
      loja: { id: 999 },
    },
  };
}

describe('WebhookService.processarPedidoCriado — persistência de status de sincronização', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marca o evento como sincronizado quando a integração com o CIGAM é bem-sucedida', async () => {
    const { service, eventService } = buildWebhookService({
      enviarPedido: async () => 'CIGAM-123',
    });

    const result = await service.processarPedidoCriado(buildPayload());

    expect(result).toBe('CIGAM-123');
    expect(eventService.markSyncSuccess).toHaveBeenCalledWith('evento-uuid', 'CIGAM-123');
    expect(eventService.markSyncFailure).not.toHaveBeenCalled();
  });

  it('marca o evento como falha quando a integração com o CIGAM lança um erro, sem propagar a exceção', async () => {
    const { service, eventService } = buildWebhookService({
      enviarPedido: async () => { throw new Error('CIGAM indisponível'); },
    });

    const result = await service.processarPedidoCriado(buildPayload());

    expect(result).toBeNull();
    expect(eventService.markSyncFailure).toHaveBeenCalledWith('evento-uuid', 'CIGAM indisponível');
    expect(eventService.markSyncSuccess).not.toHaveBeenCalled();
  });
});
