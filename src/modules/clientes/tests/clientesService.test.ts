import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientesService } from '../services/clientesService';
import { NotFoundError } from '@/shared/errors/AppError';

describe('ClientesService', () => {
  let service: ClientesService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { create: vi.fn(), findAll: vi.fn(), findById: vi.fn(), findByIdBling: vi.fn(), update: vi.fn(), delete: vi.fn() };
    service = new ClientesService(mockRepo);
  });

  it('create', async () => {
    mockRepo.create.mockResolvedValue({ id: 'uuid' });
    const result = await service.create({ nome: 'João' } as any);
    expect(result.id).toBe('uuid');
  });

  it('findAll', async () => {
    mockRepo.findAll.mockResolvedValue([{ id: '1' }]);
    expect(await service.findAll()).toHaveLength(1);
  });

  it('findById', async () => {
    mockRepo.findById.mockResolvedValue({ id: '123' });
    expect((await service.findById('123')).id).toBe('123');
  });

  it('findById throws when not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.findById('999')).rejects.toThrow(NotFoundError);
  });

  it('findByIdBling', async () => {
    mockRepo.findByIdBling.mockResolvedValue({ id: '123', id_bling: 'bling-1' });
    expect((await service.findByIdBling('bling-1')).id_bling).toBe('bling-1');
  });

  it('findByIdBling throws when not found', async () => {
    mockRepo.findByIdBling.mockResolvedValue(null);
    await expect(service.findByIdBling('x')).rejects.toThrow(NotFoundError);
  });

  it('update', async () => {
    mockRepo.findById.mockResolvedValue({ id: '123' });
    mockRepo.update.mockResolvedValue({ id: '123', nome: 'Novo' });
    expect((await service.update('123', { nome: 'Novo' })).nome).toBe('Novo');
  });

  it('update throws when not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.update('999', {} as any)).rejects.toThrow(NotFoundError);
  });

  it('delete', async () => {
    mockRepo.findById.mockResolvedValue({ id: '123' });
    await service.delete('123');
    expect(mockRepo.delete).toHaveBeenCalledWith('123');
  });

  it('delete throws when not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.delete('999')).rejects.toThrow(NotFoundError);
  });
});
