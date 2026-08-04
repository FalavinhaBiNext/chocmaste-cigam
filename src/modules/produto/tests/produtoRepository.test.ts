import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ProdutoRepository } from '../repositories/produtoRepository';
import { syncDatabase, closeDatabase } from '@/tests/helpers/db';
import { createProdutoInput } from '@/tests/helpers/factories';

describe('ProdutoRepository', () => {
  let repo: ProdutoRepository;
  let created: any;

  beforeAll(async () => {
    await syncDatabase();
    repo = new ProdutoRepository();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should create a produto', async () => {
    const input = createProdutoInput();
    created = await repo.create(input);
    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.nome).toBe('Chocolate Amargo 70%');
  });

  it('should find all', async () => {
    const result = await repo.findAll();
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('should find by id', async () => {
    const result = await repo.findById(created.id);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(created.id);
  });

  it('should find by bling id', async () => {
    const result = await repo.findByIdBling('bling-prod-001');
    expect(result).not.toBeNull();
  });

  it('should find by idProduto', async () => {
    const result = await repo.findByIdProduto('prod-001');
    expect(result).not.toBeNull();
  });

  it('should update', async () => {
    const result = await repo.update(created.id, { nome: 'Chocolate Atualizado' });
    expect(result!.nome).toBe('Chocolate Atualizado');
  });

  it('should return null for non-existent id', async () => {
    const result = await repo.findById('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });

  it('should delete', async () => {
    await repo.delete(created.id);
    const result = await repo.findById(created.id);
    expect(result).toBeNull();
  });
});
