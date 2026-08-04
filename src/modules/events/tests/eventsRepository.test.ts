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
});
