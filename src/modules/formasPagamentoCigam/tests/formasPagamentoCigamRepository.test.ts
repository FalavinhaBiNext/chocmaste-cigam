import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FormasPagamentoCigamRepository } from '../repositories/formasPagamentoCigamRepository';
import { syncDatabase, closeDatabase } from '@/tests/helpers/db';
import { createFormasPagamentoCigamInput } from '@/tests/helpers/factories';

describe('FormasPagamentoCigamRepository', () => {
  let repo: FormasPagamentoCigamRepository;
  let created: any;

  beforeAll(async () => {
    await syncDatabase();
    repo = new FormasPagamentoCigamRepository();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('create', async () => {
    created = await repo.create(createFormasPagamentoCigamInput());
    expect(created.id).toBeDefined();
    expect(created.descricao).toBe('Cartão de Crédito');
  });

  it('findAll', async () => {
    expect((await repo.findAll()).length).toBeGreaterThanOrEqual(1);
  });

  it('findById', async () => {
    expect((await repo.findById(created.id))!.id).toBe(created.id);
  });

  it('findByIdCigam', async () => {
    expect((await repo.findByIdCigam('cigam-fp-001'))!.id_cigam).toBe('cigam-fp-001');
  });

  it('update', async () => {
    expect((await repo.update(created.id, { descricao: 'Descrição Atualizada' }))!.descricao).toBe('Descrição Atualizada');
  });

  it('not found returns null', async () => {
    expect(await repo.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('delete', async () => {
    await repo.delete(created.id);
    expect(await repo.findById(created.id)).toBeNull();
  });
});
