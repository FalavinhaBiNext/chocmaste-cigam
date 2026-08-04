import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProdutoService } from '../services/produtoService';
import { NotFoundError } from '@/shared/errors/AppError';

describe('ProdutoService', () => {
  let service: ProdutoService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      findByIdBling: vi.fn(),
      findByIdProduto: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new ProdutoService(mockRepository);
  });

  it('should create a produto', async () => {
    const input = { nome: 'Choco', preco: 10 } as any;
    const expected = { id: 'uuid', nome: 'Choco' };
    mockRepository.create.mockResolvedValue(expected);

    const result = await service.create(input);
    expect(result).toEqual(expected);
  });

  it('should return all produtos', async () => {
    mockRepository.findAll.mockResolvedValue([{ id: '1' }]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });

  it('should find by id', async () => {
    mockRepository.findById.mockResolvedValue({ id: '123' });
    const result = await service.findById('123');
    expect(result.id).toBe('123');
  });

  it('should throw NotFoundError when findById fails', async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.findById('999')).rejects.toThrow(NotFoundError);
  });

  it('should find by bling id', async () => {
    mockRepository.findByIdBling.mockResolvedValue({ id: '123', id_bling: 'bling-1' });
    const result = await service.findByIdBling('bling-1');
    expect(result.id_bling).toBe('bling-1');
  });

  it('should throw NotFoundError when findByIdBling fails', async () => {
    mockRepository.findByIdBling.mockResolvedValue(null);
    await expect(service.findByIdBling('nonexistent')).rejects.toThrow(NotFoundError);
  });

  it('should find by idProduto', async () => {
    mockRepository.findByIdProduto.mockResolvedValue({ id: '123', id_produto: 'prod-001' });
    const result = await service.findByIdProduto('prod-001');
    expect(result.id_produto).toBe('prod-001');
  });

  it('should throw NotFoundError when findByIdProduto fails', async () => {
    mockRepository.findByIdProduto.mockResolvedValue(null);
    await expect(service.findByIdProduto('nonexistent')).rejects.toThrow(NotFoundError);
  });

  it('should update when exists', async () => {
    mockRepository.findById.mockResolvedValue({ id: '123' });
    mockRepository.update.mockResolvedValue({ id: '123', nome: 'Novo' });

    const result = await service.update('123', { nome: 'Novo' });
    expect(result.nome).toBe('Novo');
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
