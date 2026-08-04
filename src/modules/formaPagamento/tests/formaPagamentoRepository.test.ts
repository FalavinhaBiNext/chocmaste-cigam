import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FormaPagamentoRepository } from '../repositories/formaPagamentoRepository';
import { syncDatabase, closeDatabase } from '@/tests/helpers/db';
import { createFormaPagamentoInput } from '@/tests/helpers/factories';

describe('FormaPagamentoRepository', () => {
  let repo: FormaPagamentoRepository;
  let created: any;

  beforeAll(async () => {
    await syncDatabase();
    repo = new FormaPagamentoRepository();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('create', async () => {
    created = await repo.create(createFormaPagamentoInput());
    expect(created.id).toBeDefined();
    expect(created.descricao).toBe('Cartão de Crédito');
  });

  it('findAll', async () => {
    expect((await repo.findAll()).length).toBeGreaterThanOrEqual(1);
  });

  it('findById', async () => {
    expect((await repo.findById(created.id))!.id).toBe(created.id);
  });

  it('findByIdBling', async () => {
    expect((await repo.findByIdBling('bling-fp-001'))!.id_bling).toBe('bling-fp-001');
  });

  it('update', async () => {
    expect((await repo.update(created.id, { descricao: 'Débito' }))!.descricao).toBe('Débito');
  });

  it('not found returns null', async () => {
    expect(await repo.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('delete', async () => {
    await repo.delete(created.id);
    expect(await repo.findById(created.id)).toBeNull();
  });
});
