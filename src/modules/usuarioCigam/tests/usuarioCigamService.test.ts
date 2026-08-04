import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsuarioCigamService } from '../services/usuarioCigamService';
import { NotFoundError } from '@/shared/errors/AppError';

describe('UsuarioCigamService', () => {
  let svc: UsuarioCigamService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: vi.fn(), findAll: vi.fn().mockResolvedValue([]), findById: vi.fn(),
      findByEnv: vi.fn(), update: vi.fn(), delete: vi.fn(), alterAtivo: vi.fn(),
    };
    svc = new UsuarioCigamService(repo);
  });

  it('create saves CIGAM user credentials', async () => {
    repo.create.mockImplementation((d: any) => Promise.resolve(d));
    const input = { ambiente: 'prod', login: 'u', senha: 'minha-senha', url_ambiente: 'url' };
    const result = await svc.create(input);
    expect(result.senha).toBe('minha-senha');
    expect(repo.create).toHaveBeenCalledOnce();
  });

  it('findAll', async () => {
    repo.findAll.mockResolvedValue([{ id: '1' }]);
    expect(await svc.findAll()).toHaveLength(1);
  });

  it('findById', async () => {
    repo.findById.mockResolvedValue({ id: '1' });
    const res = await svc.findById('1');
    expect(res?.id).toBe('1');
  });

  it('findById throws', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(svc.findById('x')).rejects.toThrow(NotFoundError);
  });

  it('findByEnv', async () => {
    repo.findByEnv.mockResolvedValue({ id: '1', ambiente: 'prod' });
    const res = await svc.findByEnv('prod');
    expect(res?.ambiente).toBe('prod');
  });

  it('findByEnv throws', async () => {
    repo.findByEnv.mockResolvedValue(null);
    await expect(svc.findByEnv('x')).rejects.toThrow(NotFoundError);
  });

  it('update', async () => {
    repo.findById.mockResolvedValue({ id: '1' });
    await svc.update('1', { login: 'novo' });
    expect(repo.update).toHaveBeenCalledWith('1', { login: 'novo' });
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

  it('alterAtivo toggles active', async () => {
    repo.findById.mockResolvedValue({ id: '1', ativo: true });
    await svc.alterAtivo('1');
    expect(repo.alterAtivo).toHaveBeenCalledWith('1', false);
  });

  it('alterAtivo throws when not found', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(svc.alterAtivo('x')).rejects.toThrow(NotFoundError);
  });
});
