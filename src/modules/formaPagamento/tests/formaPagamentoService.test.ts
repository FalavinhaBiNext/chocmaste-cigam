import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormaPagamentoService } from '../services/formaPagamentoService';
import { NotFoundError } from '@/shared/errors/AppError';

describe('FormaPagamentoService', () => {
  let svc: FormaPagamentoService;
  let repo: any;

  beforeEach(() => {
    repo = { create: vi.fn(), findAll: vi.fn(), findById: vi.fn(), findByIdBling: vi.fn(), update: vi.fn(), delete: vi.fn() };
    svc = new FormaPagamentoService(repo);
  });

  it('create', async () => {
    repo.create.mockResolvedValue({ id: 'u' });
    expect((await svc.create({ id_bling: 'b1', descricao: 'D' } as any)).id).toBe('u');
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

  it('findByIdBling', async () => {
    repo.findByIdBling.mockResolvedValue({ id: '1', id_bling: 'b1' });
    expect((await svc.findByIdBling('b1')).id_bling).toBe('b1');
  });

  it('findByIdBling throws', async () => {
    repo.findByIdBling.mockResolvedValue(null);
    await expect(svc.findByIdBling('x')).rejects.toThrow(NotFoundError);
  });

  it('update', async () => {
    repo.findById.mockResolvedValue({ id: '1' });
    repo.update.mockResolvedValue({ id: '1', descricao: 'Novo' });
    expect((await svc.update('1', { descricao: 'Novo' })).descricao).toBe('Novo');
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
});
