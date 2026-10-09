import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { WebhookJobRepository } from '../repositories/webhookJobRepository';
import { WebhookJobModel } from '../models/webhookJobModel';
import { syncDatabase, closeDatabase } from '@/tests/helpers/db';

describe('WebhookJobRepository', () => {
  let repo: WebhookJobRepository;

  beforeAll(async () => {
    await syncDatabase();
    repo = new WebhookJobRepository();
  });

  beforeEach(async () => {
    await WebhookJobModel.destroy({ where: {} });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  const input = (eventId: string) => ({
    event_id: eventId,
    tipo: 'bling.pedido',
    pedido_id: 123,
    payload: { eventId, data: { id: 123 } },
  });

  it('enqueue cria o job pendente e ignora event_id duplicado', async () => {
    const primeiro = await repo.enqueue(input('evt-1'));
    const segundo = await repo.enqueue(input('evt-1'));

    expect(primeiro.created).toBe(true);
    expect(primeiro.job.status).toBe('pendente');
    expect(segundo.created).toBe(false);
    expect(segundo.job.id).toBe(primeiro.job.id);
    expect(await WebhookJobModel.count()).toBe(1);
  });

  it('enqueue preserva o payload como objeto', async () => {
    const { job } = await repo.enqueue(input('evt-payload'));
    const salvo = await repo.findById(job.id);
    expect(salvo!.payload).toEqual({ eventId: 'evt-payload', data: { id: 123 } });
  });

  it('claimNext reserva o job mais antigo, soma a tentativa e não o devolve de novo', async () => {
    const { job } = await repo.enqueue(input('evt-2'));

    const reservado = await repo.claimNext();
    expect(reservado!.id).toBe(job.id);
    expect(reservado!.status).toBe('processando');
    expect(reservado!.tentativas).toBe(1);

    expect(await repo.claimNext()).toBeNull();
  });

  it('claimNext ignora jobs agendados para o futuro', async () => {
    const { job } = await repo.enqueue(input('evt-3'));
    await repo.markRetry(job.id, 'erro', new Date(Date.now() + 60_000));

    expect(await repo.claimNext()).toBeNull();
    expect((await repo.claimNext(new Date(Date.now() + 120_000)))!.id).toBe(job.id);
  });

  it('requeueStuck devolve à fila os jobs presos em processando', async () => {
    await repo.enqueue(input('evt-4'));
    await repo.claimNext();

    expect(await repo.requeueStuck()).toBe(1);
    expect((await repo.claimNext())!.tentativas).toBe(2);
  });

  it('requeue zera as tentativas de um job em falha', async () => {
    const { job } = await repo.enqueue(input('evt-5'));
    await repo.claimNext();
    await repo.markFailed(job.id, 'erro definitivo');

    expect(await repo.requeue(job.id)).toBe(true);
    const recolocado = await repo.findById(job.id);
    expect(recolocado!.status).toBe('pendente');
    expect(recolocado!.tentativas).toBe(0);
  });

  it('purgeDoneBefore remove só concluídos antigos', async () => {
    const { job: concluido } = await repo.enqueue(input('evt-6'));
    const { job: pendente } = await repo.enqueue(input('evt-7'));
    await repo.markDone(concluido.id);

    expect(await repo.purgeDoneBefore(new Date(Date.now() + 1_000))).toBe(1);
    expect(await repo.findById(concluido.id)).toBeNull();
    expect(await repo.findById(pendente.id)).not.toBeNull();
  });
});
