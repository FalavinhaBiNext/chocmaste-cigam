import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventService } from '../services/eventService';
import { NotFoundError } from '@/shared/errors/AppError';

describe('EventService', () => {
  let svc: EventService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: vi.fn(), findAll: vi.fn(), findById: vi.fn(),
      findByPedido: vi.fn(), findByNumeroPedido: vi.fn(),
    };
    svc = new EventService(repo as any);
  });

  it('create', async () => {
    repo.create.mockResolvedValue({ id: 'u' });
    expect((await svc.create({ event: 'test', companyId: 'c1', data: { data: '2024-01-15', id: 123, numero: 1001, numeroLoja: 'LOJA', total: 250 } } as any)).id).toBe('u');
  });

  it('findAll', async () => {
    repo.findAll.mockResolvedValue([{ id: '1' }]);
    expect(await svc.findAll()).toHaveLength(1);
  });

  it('findById', async () => {
    repo.findById.mockResolvedValue({ id: '1' });
    expect((await svc.findById('1')).id).toBe('1');
  });

  it('findById throws', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(svc.findById('x')).rejects.toThrow(NotFoundError);
  });

  it('findByPedido', async () => {
    repo.findByPedido.mockResolvedValue({ id: '1', pedido_id: 123 });
    expect((await svc.findByPedido(123)).pedido_id).toBe(123);
  });

  it('findByPedido throws', async () => {
    repo.findByPedido.mockResolvedValue(null);
    await expect(svc.findByPedido(999)).rejects.toThrow(NotFoundError);
  });

  it('findByNumeroPedido', async () => {
    repo.findByNumeroPedido.mockResolvedValue({ id: '1', numero_pedido: 1001 });
    expect((await svc.findByNumeroPedido(1001)).numero_pedido).toBe(1001);
  });

  it('findByNumeroPedido throws', async () => {
    repo.findByNumeroPedido.mockResolvedValue(null);
    await expect(svc.findByNumeroPedido(999)).rejects.toThrow(NotFoundError);
  });
});
