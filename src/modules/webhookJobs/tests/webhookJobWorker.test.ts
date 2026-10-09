import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookJobWorker, WEBHOOK_JOB_MAX_TENTATIVAS, WEBHOOK_JOB_TIPO_BLING_PEDIDO } from '../services/webhookJobWorker';

describe('WebhookJobWorker', () => {
  let repo: any;
  let webhookService: any;
  let worker: WebhookJobWorker;

  const job = (overrides: Record<string, unknown> = {}) => ({
    id: 'job-1',
    tipo: WEBHOOK_JOB_TIPO_BLING_PEDIDO,
    pedido_id: 123,
    payload: { eventId: 'evt-1', data: { id: 123 } },
    tentativas: 1,
    ...overrides,
  });

  beforeEach(() => {
    repo = {
      claimNext: vi.fn().mockResolvedValue(null),
      markDone: vi.fn(),
      markRetry: vi.fn(),
      markFailed: vi.fn(),
      requeueStuck: vi.fn().mockResolvedValue(0),
      purgeDoneBefore: vi.fn().mockResolvedValue(0),
    };
    webhookService = { processarPedidoCriado: vi.fn().mockResolvedValue('CIGAM-1') };
    worker = new WebhookJobWorker(repo, webhookService);
  });

  it('processa o job com o payload salvo e marca como concluído', async () => {
    await worker.processar(job() as any);

    expect(webhookService.processarPedidoCriado).toHaveBeenCalledWith({ eventId: 'evt-1', data: { id: 123 } });
    expect(repo.markDone).toHaveBeenCalledWith('job-1');
  });

  it('aceita payload salvo como string JSON', async () => {
    await worker.processar(job({ payload: '{"eventId":"evt-1","data":{"id":123}}' }) as any);

    expect(webhookService.processarPedidoCriado).toHaveBeenCalledWith({ eventId: 'evt-1', data: { id: 123 } });
  });

  it('em caso de erro, agenda nova tentativa com espera crescente', async () => {
    webhookService.processarPedidoCriado.mockRejectedValue(new Error('Bling fora do ar'));
    const antes = Date.now();

    await worker.processar(job({ tentativas: 2 }) as any);

    expect(repo.markDone).not.toHaveBeenCalled();
    const [id, erro, proxima] = repo.markRetry.mock.calls[0];
    expect(id).toBe('job-1');
    expect(erro).toBe('Bling fora do ar');
    // 2ª tentativa falhou → espera de 5 minutos
    expect((proxima as Date).getTime() - antes).toBeGreaterThanOrEqual(5 * 60_000);
    expect((proxima as Date).getTime() - antes).toBeLessThan(6 * 60_000);
  });

  it('marca falha definitiva ao esgotar as tentativas', async () => {
    webhookService.processarPedidoCriado.mockRejectedValue(new Error('erro persistente'));

    await worker.processar(job({ tentativas: WEBHOOK_JOB_MAX_TENTATIVAS }) as any);

    expect(repo.markFailed).toHaveBeenCalledWith('job-1', 'erro persistente');
    expect(repo.markRetry).not.toHaveBeenCalled();
  });

  it('tipo desconhecido vira erro do job', async () => {
    await worker.processar(job({ tipo: 'outro.tipo' }) as any);

    expect(webhookService.processarPedidoCriado).not.toHaveBeenCalled();
    expect(repo.markRetry).toHaveBeenCalled();
  });

  it('drenarFila processa os jobs um de cada vez até a fila esvaziar', async () => {
    const ordem: string[] = [];
    repo.claimNext
      .mockResolvedValueOnce(job({ id: 'a' }))
      .mockResolvedValueOnce(job({ id: 'b' }))
      .mockResolvedValueOnce(null);
    webhookService.processarPedidoCriado.mockImplementation(async () => {
      ordem.push('inicio');
      await new Promise((r) => setTimeout(r, 5));
      ordem.push('fim');
    });

    // start() já dispara a drenagem da fila
    await worker.start();
    await vi.waitFor(() => expect(repo.claimNext).toHaveBeenCalledTimes(3));
    worker.stop();

    expect(repo.markDone).toHaveBeenCalledWith('a');
    expect(repo.markDone).toHaveBeenCalledWith('b');
    // Nunca dois processamentos sobrepostos
    expect(ordem).toEqual(['inicio', 'fim', 'inicio', 'fim']);
  });

  it('start devolve à fila os jobs interrompidos por reinício', async () => {
    await worker.start();
    worker.stop();

    expect(repo.requeueStuck).toHaveBeenCalled();
  });
});
