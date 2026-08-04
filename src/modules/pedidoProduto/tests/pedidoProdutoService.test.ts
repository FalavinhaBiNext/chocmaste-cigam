import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PedidoProdutoService } from '../services/pedidoProdutoService';
import { NotFoundError } from '@/shared/errors/AppError';

describe('PedidoProdutoService', () => {
  let svc: PedidoProdutoService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: vi.fn(), findAll: vi.fn(), findById: vi.fn(),
      findByIdPedido: vi.fn(), findByIdProduto: vi.fn(),
      update: vi.fn(), delete: vi.fn(), deleteByIdPedido: vi.fn(),
    };
    svc = new PedidoProdutoService(repo);
  });

  it('create calculates total', async () => {
    repo.create.mockImplementation((d: any) => Promise.resolve(d));
    const input = { id_pedido: 'p1', id_produto: 'pr1', quantidade: 3, preco: 10.00, total: 30.00 };
    const result = await svc.create(input as any);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      total: 30.00,
    }));
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

  it('findByIdPedido', async () => {
    repo.findByIdPedido.mockResolvedValue([{ id_pedido: 'p1' }]);
    expect(await svc.findByIdPedido('p1')).toHaveLength(1);
  });

  it('findByIdProduto', async () => {
    repo.findByIdProduto.mockResolvedValue([{ id_produto: 'pr1' }]);
    expect(await svc.findByIdProduto('pr1')).toHaveLength(1);
  });

  it('update', async () => {
    repo.findById.mockResolvedValue({ id: '1' });
    repo.update.mockResolvedValue({ id: '1', quantidade: 10 });
    expect((await svc.update('1', { quantidade: 10 })).quantidade).toBe(10);
  });

  it('update throws', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(svc.update('x', {} as any)).rejects.toThrow(NotFoundError);
  });

  it('delete', async () => {
    repo.findById.mockResolvedValue({ id: '1' });
    await svc.delete('1');
    expect(repo.delete).toHaveBeenCalledWith('1');
  });

  it('delete throws', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(svc.delete('x')).rejects.toThrow(NotFoundError);
  });

  it('deleteByIdPedido', async () => {
    await svc.deleteByIdPedido('p1');
    expect(repo.deleteByIdPedido).toHaveBeenCalledWith('p1');
  });
});
