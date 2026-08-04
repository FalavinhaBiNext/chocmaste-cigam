import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TransportadorasCigamRepository } from '../repositories/transportadorasCigamRepository';
import { syncDatabase, closeDatabase } from '@/tests/helpers/db';
import { createTransportadorasCigamInput } from '@/tests/helpers/factories';

describe('TransportadorasCigamRepository', () => {
  let repo: TransportadorasCigamRepository;
  let created: any;

  beforeAll(async () => {
    await syncDatabase();
    repo = new TransportadorasCigamRepository();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('create', async () => {
    created = await repo.create(createTransportadorasCigamInput());
    expect(created.id).toBeDefined();
    expect(created.nome).toBe('Transportadora ABC Ltda');
  });

  it('findAll', async () => {
    expect((await repo.findAll()).length).toBeGreaterThanOrEqual(1);
  });

  it('findById', async () => {
    expect((await repo.findById(created.id))!.id).toBe(created.id);
  });

  it('findByIdCigam', async () => {
    expect((await repo.findByIdCigam('cigam-transp-001'))!.id_cigam).toBe('cigam-transp-001');
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
