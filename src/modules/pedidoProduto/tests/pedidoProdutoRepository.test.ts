import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PedidoProdutoRepository } from '../repositories/pedidoProdutoRepository';
import { PedidoRepository } from '@/modules/pedido/repositories/pedidoRepository';
import { ProdutoRepository } from '@/modules/produto/repositories/produtoRepository';
import { syncDatabase, closeDatabase } from '@/tests/helpers/db';
import { createPedidoInput, createProdutoInput, createPedidoProdutoInput } from '@/tests/helpers/factories';

describe('PedidoProdutoRepository', () => {
  let repo: PedidoProdutoRepository;
  let pedidoRepo: PedidoRepository;
  let produtoRepo: ProdutoRepository;
  let pedidoId: string;
  let produtoId: string;
  let created: any;

  beforeAll(async () => {
    await syncDatabase();
    repo = new PedidoProdutoRepository();
    pedidoRepo = new PedidoRepository();
    produtoRepo = new ProdutoRepository();

    const pedido = await pedidoRepo.create(createPedidoInput({ id_bling: 'pp-bling-1' }));
    const produto = await produtoRepo.create(createProdutoInput({ id_bling: 'pp-prod-bling', nome: 'PP Produto' }));
    pedidoId = pedido.id;
    produtoId = produto.id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('create', async () => {
    created = await repo.create(createPedidoProdutoInput({ id_pedido: pedidoId, id_produto: produtoId }));
    expect(created.id).toBeDefined();
    expect(created.quantidade).toBe(5);
  });

  it('findAll', async () => {
    expect((await repo.findAll()).length).toBeGreaterThanOrEqual(1);
  });

  it('findById', async () => {
    expect((await repo.findById(created.id))!.id).toBe(created.id);
  });

  it('findByIdPedido', async () => {
    const results = await repo.findByIdPedido(pedidoId);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id_pedido).toBe(pedidoId);
  });

  it('findByIdProduto', async () => {
    const results = await repo.findByIdProduto(produtoId);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id_produto).toBe(produtoId);
  });

  it('update', async () => {
    expect((await repo.update(created.id, { quantidade: 10 }))!.quantidade).toBe(10);
  });

  it('not found returns null', async () => {
    expect(await repo.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('delete', async () => {
    const item = await repo.create(createPedidoProdutoInput({ id_pedido: pedidoId, id_produto: produtoId }));
    await repo.delete(item.id);
    expect(await repo.findById(item.id)).toBeNull();
  });

  it('deleteByIdPedido', async () => {
    await repo.create(createPedidoProdutoInput({ id_pedido: pedidoId, id_produto: produtoId }));
    await repo.deleteByIdPedido(pedidoId);
    const remaining = await repo.findByIdPedido(pedidoId);
    expect(remaining.length).toBe(0);
  });
});
