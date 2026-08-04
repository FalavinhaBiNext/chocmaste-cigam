import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TransportadoraRepository } from '../repositories/transportadoraRepository';
import { syncDatabase, closeDatabase } from '@/tests/helpers/db';
import { createTransportadoraInput } from '@/tests/helpers/factories';

describe('TransportadoraRepository', () => {
  let repo: TransportadoraRepository;
  let created: any;

  beforeAll(async () => {
    await syncDatabase();
    repo = new TransportadoraRepository();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('create', async () => {
    created = await repo.create(createTransportadoraInput());
    expect(created.id).toBeDefined();
    expect(created.nome).toBe('Transportadora ABC Ltda');
  });

  it('findAll', async () => {
    expect((await repo.findAll()).length).toBeGreaterThanOrEqual(1);
  });

  it('findById', async () => {
    expect((await repo.findById(created.id))!.id).toBe(created.id);
  });

  it('findByIdBling', async () => {
    expect((await repo.findByIdBling('bling-transp-001'))!.id_bling).toBe('bling-transp-001');
  });

  it('update', async () => {
    expect((await repo.update(created.id, { nome: 'Nova Trans' }))!.nome).toBe('Nova Trans');
  });

  it('not found returns null', async () => {
    expect(await repo.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('delete', async () => {
    await repo.delete(created.id);
    expect(await repo.findById(created.id)).toBeNull();
  });
});
