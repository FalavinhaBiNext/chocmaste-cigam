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
      updateSyncStatus: vi.fn(), findBySyncStatus: vi.fn(),
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
    expect(repo.findAll).toHaveBeenCalled();
    expect(repo.findBySyncStatus).not.toHaveBeenCalled();
  });

  it('findAll with sync_status filters by findBySyncStatus', async () => {
    repo.findBySyncStatus.mockResolvedValue([{ id: '1', sync_status: 'falha' }]);
    const result = await svc.findAll('falha');
    expect(result).toHaveLength(1);
    expect(repo.findBySyncStatus).toHaveBeenCalledWith('falha');
    expect(repo.findAll).not.toHaveBeenCalled();
  });

  it('findById', async () => {
    repo.findById.mockResolvedValue({ id: '1' });
    expect((await svc.findById('1'))!.id).toBe('1');
  });

  it('findById throws', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(svc.findById('x')).rejects.toThrow(NotFoundError);
  });

  it('findByPedido', async () => {
    repo.findByPedido.mockResolvedValue({ id: '1', pedido_id: 123 });
    expect((await svc.findByPedido(123))!.pedido_id).toBe(123);
  });

  it('findByPedido returns null when not found', async () => {
    repo.findByPedido.mockResolvedValue(null);
    expect(await svc.findByPedido(999)).toBeNull();
  });

  it('findByNumeroPedido', async () => {
    repo.findByNumeroPedido.mockResolvedValue({ id: '1', numero_pedido: 1001 });
    expect((await svc.findByNumeroPedido(1001))!.numero_pedido).toBe(1001);
  });

  it('findByNumeroPedido throws', async () => {
    repo.findByNumeroPedido.mockResolvedValue(null);
    await expect(svc.findByNumeroPedido(999)).rejects.toThrow(NotFoundError);
  });

  it('markSyncFailure increments retry_count from the current event', async () => {
    repo.findById.mockResolvedValue({ id: '1', retry_count: 2 });
    await svc.markSyncFailure('1', 'CIGAM indisponível');
    expect(repo.updateSyncStatus).toHaveBeenCalledWith('1', {
      sync_status: 'falha',
      error_message: 'CIGAM indisponível',
      retry_count: 3,
    });
  });

  it('markSyncFailure starts retry_count at 1 when the event has none yet', async () => {
    repo.findById.mockResolvedValue({ id: '1' });
    await svc.markSyncFailure('1', 'erro');
    expect(repo.updateSyncStatus).toHaveBeenCalledWith('1', {
      sync_status: 'falha',
      error_message: 'erro',
      retry_count: 1,
    });
  });

  it('markSyncSuccess clears error_message and preserves retry_count', async () => {
    repo.findById.mockResolvedValue({ id: '1', retry_count: 2 });
    await svc.markSyncSuccess('1', 'CIGAM-123');
    expect(repo.updateSyncStatus).toHaveBeenCalledWith('1', {
      sync_status: 'sincronizado',
      error_message: null,
      retry_count: 2,
      cigam_sincronizado: true,
      cigam_pedido_id: 'CIGAM-123',
    });
  });
});
