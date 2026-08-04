import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientesCigamService } from '../services/clientesCigamService';
import { NotFoundError } from '@/shared/errors/AppError';

describe('ClientesCigamService', () => {
  let service: ClientesCigamService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      findByIdCigam: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new ClientesCigamService(mockRepository);
  });

  it('should create', async () => {
    mockRepository.create.mockResolvedValue({ id: 'uuid' });
    const result = await service.create({ id_cigam: 'cc1', nome: 'Maria' } as any);
    expect(result.id).toBe('uuid');
  });

  it('should findAll', async () => {
    mockRepository.findAll.mockResolvedValue([{ id: '1' }]);
    expect(await service.findAll()).toHaveLength(1);
  });

  it('should findById', async () => {
    mockRepository.findById.mockResolvedValue({ id: '123' });
    expect((await service.findById('123')).id).toBe('123');
  });

  it('should throw on findById when not found', async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.findById('999')).rejects.toThrow(NotFoundError);
  });

  it('should findByIdCigam', async () => {
    mockRepository.findByIdCigam.mockResolvedValue({ id: '123', id_cigam: 'cc1' });
    expect((await service.findByIdCigam('cc1')).id_cigam).toBe('cc1');
  });

  it('should throw on findByIdCigam when not found', async () => {
    mockRepository.findByIdCigam.mockResolvedValue(null);
    await expect(service.findByIdCigam('x')).rejects.toThrow(NotFoundError);
  });

  it('should update when exists', async () => {
    mockRepository.findById.mockResolvedValue({ id: '123' });
    mockRepository.update.mockResolvedValue({ id: '123', nome: 'Novo' });
    expect((await service.update('123', { nome: 'Novo' })).nome).toBe('Novo');
  });

  it('should throw on update when not found', async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.update('999', {} as any)).rejects.toThrow(NotFoundError);
  });

  it('should delete when exists', async () => {
    mockRepository.findById.mockResolvedValue({ id: '123' });
    await service.delete('123');
    expect(mockRepository.delete).toHaveBeenCalledWith('123');
  });

  it('should throw on delete when not found', async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.delete('999')).rejects.toThrow(NotFoundError);
  });
});
