import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { EventRepository } from '../repositories/eventRepository';
import { syncDatabase, closeDatabase } from '@/tests/helpers/db';
import { createEventInput } from '@/tests/helpers/factories';

describe('EventRepository', () => {
  let repo: EventRepository;
  let created: any;

  beforeAll(async () => {
    await syncDatabase();
    repo = new EventRepository();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('create', async () => {
    created = await repo.create(createEventInput({ id: '550e8400-e29b-41d4-a716-446655440000' }) as any);
    expect(created.id).toBeDefined();
    expect(created.event).toBe('order.created');
  });

  it('findAll', async () => {
    expect((await repo.findAll()).length).toBeGreaterThanOrEqual(1);
  });

  it('findById', async () => {
    expect((await repo.findById(created.id))!.id).toBe(created.id);
  });

  it('findByPedido', async () => {
    expect((await repo.findByPedido(12345))!.pedido_id).toBe(12345);
  });

  it('findByNumeroPedido', async () => {
    expect((await repo.findByNumeroPedido(1001))!.numero_pedido).toBe(1001);
  });

  it('not found returns null', async () => {
    expect(await repo.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('created event defaults to sync_status pendente', async () => {
    expect(created.sync_status).toBe('pendente');
    expect(created.retry_count).toBe(0);
    expect(created.error_message).toBeNull();
  });

  it('updateSyncStatus persists falha with error_message and retry_count', async () => {
    await repo.updateSyncStatus(created.id, {
      sync_status: 'falha',
      error_message: 'CIGAM indisponível',
      retry_count: 1,
    });
    const updated = await repo.findById(created.id);
    expect(updated!.sync_status).toBe('falha');
    expect(updated!.error_message).toBe('CIGAM indisponível');
    expect(updated!.retry_count).toBe(1);
  });

  it('updateSyncStatus persists sincronizado and clears error_message', async () => {
    await repo.updateSyncStatus(created.id, {
      sync_status: 'sincronizado',
      error_message: null,
      retry_count: 1,
      cigam_sincronizado: true,
      cigam_pedido_id: 'CIGAM-1',
    });
    const updated = await repo.findById(created.id);
    expect(updated!.sync_status).toBe('sincronizado');
    expect(updated!.error_message).toBeNull();
    expect(updated!.cigam_sincronizado).toBe(true);
    expect(updated!.cigam_pedido_id).toBe('CIGAM-1');
  });

  it('findBySyncStatus returns only events with the given status', async () => {
    const falho = await repo.create(createEventInput({
      id: '650e8400-e29b-41d4-a716-446655440001',
      pedido_id: 22222,
      numero_pedido: 2002,
    }) as any);
    await repo.updateSyncStatus(falho.id, { sync_status: 'falha', error_message: 'erro', retry_count: 1 });

    const falhas = await repo.findBySyncStatus('falha');
    expect(falhas.map(e => e.id)).toContain(falho.id);
    expect(falhas.every(e => e.sync_status === 'falha')).toBe(true);
  });

  it('countBySyncStatus aggregates counts per status', async () => {
    const counts = await repo.countBySyncStatus();
    const total = Object.values(counts).reduce((acc, n) => acc + n, 0);
    expect(total).toBeGreaterThanOrEqual(2);
    expect(counts.falha).toBeGreaterThanOrEqual(1);
  });
});
