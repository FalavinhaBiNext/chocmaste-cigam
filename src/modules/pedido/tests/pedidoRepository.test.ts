import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PedidoRepository } from '../repositories/pedidoRepository';
import { syncDatabase, closeDatabase } from '@/tests/helpers/db';
import { createPedidoInput } from '@/tests/helpers/factories';

describe('PedidoRepository', () => {
  let repo: PedidoRepository;
  let createdPedido: any;

  beforeAll(async () => {
    await syncDatabase();
    repo = new PedidoRepository();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should create a pedido', async () => {
    const input = createPedidoInput();
    createdPedido = await repo.create(input);
    expect(createdPedido).toBeDefined();
    expect(createdPedido.id).toBeDefined();
    expect(createdPedido.id_bling).toBe('bling-123');
    expect(createdPedido.codigo_curto).toBe('CC-001');
  });

  it('should find all pedidos', async () => {
    const result = await repo.findAll();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('should find pedido by id', async () => {
    const result = await repo.findById(createdPedido.id);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdPedido.id);
  });

  it('should find pedido by bling id', async () => {
    const result = await repo.findByIdBling('bling-123');
    expect(result).not.toBeNull();
    expect(result!.id_bling).toBe('bling-123');
  });

  it('should find pedido by numero loja', async () => {
    const result = await repo.findByNumeroLoja('LOJA-001');
    expect(result).not.toBeNull();
    expect(result!.numero_loja).toBe('LOJA-001');
  });

  it('should update a pedido', async () => {
    const result = await repo.update(createdPedido.id, { nome_cliente: 'Maria Souza' });
    expect(result).not.toBeNull();
    expect(result!.nome_cliente).toBe('Maria Souza');
  });

  it('should return null for non-existent id on findById', async () => {
    const result = await repo.findById('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });

  it('should return null for non-existent bling id', async () => {
    const result = await repo.findByIdBling('nonexistent-bling');
    expect(result).toBeNull();
  });

  it('should return null for non-existent numero loja', async () => {
    const result = await repo.findByNumeroLoja('NONEXISTENT');
    expect(result).toBeNull();
  });

  it('should delete a pedido', async () => {
    await repo.delete(createdPedido.id);
    const result = await repo.findById(createdPedido.id);
    expect(result).toBeNull();
  });
});
