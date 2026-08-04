import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ClientesCigamRepository } from '../repositories/clientesCigamRepository';
import { syncDatabase, closeDatabase } from '@/tests/helpers/db';
import { createClientesCigamInput } from '@/tests/helpers/factories';

describe('ClientesCigamRepository', () => {
  let repo: ClientesCigamRepository;
  let created: any;

  beforeAll(async () => {
    await syncDatabase();
    repo = new ClientesCigamRepository();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('create', async () => {
    created = await repo.create(createClientesCigamInput());
    expect(created.id).toBeDefined();
    expect(created.nome).toBe('Maria Oliveira');
  });

  it('findAll', async () => {
    expect((await repo.findAll()).length).toBeGreaterThanOrEqual(1);
  });

  it('findById', async () => {
    expect((await repo.findById(created.id))!.id).toBe(created.id);
  });

  it('findByIdCigam', async () => {
    expect((await repo.findByIdCigam('cigam-cli-001'))!.id_cigam).toBe('cigam-cli-001');
  });

  it('update', async () => {
    expect((await repo.update(created.id, { nome: 'Nome Atualizado' }))!.nome).toBe('Nome Atualizado');
  });

  it('not found returns null', async () => {
    expect(await repo.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('delete', async () => {
    await repo.delete(created.id);
    expect(await repo.findById(created.id)).toBeNull();
  });
});
