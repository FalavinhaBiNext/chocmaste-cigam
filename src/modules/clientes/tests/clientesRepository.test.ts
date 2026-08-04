import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ClientesRepository } from '../repositories/clientesRepository';
import { syncDatabase, closeDatabase } from '@/tests/helpers/db';
import { createClienteInput } from '@/tests/helpers/factories';

describe('ClientesRepository', () => {
  let repo: ClientesRepository;
  let created: any;

  beforeAll(async () => {
    await syncDatabase();
    repo = new ClientesRepository();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('create', async () => {
    created = await repo.create(createClienteInput());
    expect(created.id).toBeDefined();
    expect(created.nome).toBe('Maria Oliveira');
  });

  it('findAll', async () => {
    expect((await repo.findAll()).length).toBeGreaterThanOrEqual(1);
  });

  it('findById', async () => {
    const result = await repo.findById(created.id);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(created.id);
  });

  it('findByIdBling', async () => {
    const result = await repo.findByIdBling('bling-cli-001');
    expect(result).not.toBeNull();
  });

  it('update', async () => {
    const result = await repo.update(created.id, { nome: 'Maria Atualizada' });
    expect(result!.nome).toBe('Maria Atualizada');
  });

  it('return null for non-existent id', async () => {
    expect(await repo.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('delete', async () => {
    await repo.delete(created.id);
    expect(await repo.findById(created.id)).toBeNull();
  });
});
