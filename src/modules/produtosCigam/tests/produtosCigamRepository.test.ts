import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ProdutosCigamRepository } from '../repositories/produtosCigamRepository';
import { syncDatabase, closeDatabase } from '@/tests/helpers/db';
import { createProdutosCigamInput } from '@/tests/helpers/factories';

describe('ProdutosCigamRepository', () => {
  let repo: ProdutosCigamRepository;
  let created: any;

  beforeAll(async () => {
    await syncDatabase();
    repo = new ProdutosCigamRepository();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('create', async () => {
    created = await repo.create(createProdutosCigamInput());
    expect(created.id).toBeDefined();
    expect(created.nome).toBe('Chocolate Amargo 70%');
  });

  it('findAll', async () => {
    expect((await repo.findAll()).length).toBeGreaterThanOrEqual(1);
  });

  it('findById', async () => {
    expect((await repo.findById(created.id))!.id).toBe(created.id);
  });

  it('findByIdCigam', async () => {
    expect((await repo.findByIdCigam('cigam-prod-001'))!.id_cigam).toBe('cigam-prod-001');
  });

  it('update', async () => {
    expect((await repo.update(created.id, { nome: 'Choco Atualizado' }))!.nome).toBe('Choco Atualizado');
  });

  it('not found returns null', async () => {
    expect(await repo.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('delete', async () => {
    await repo.delete(created.id);
    expect(await repo.findById(created.id)).toBeNull();
  });
});
