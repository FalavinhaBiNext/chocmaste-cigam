import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { PedidoProdutoController } from '../controllers/pedidoProdutoController';

function mockReq(o: any = {}): Partial<Request> {
  return { params: {}, body: {}, ...o };
}
function mockRes(): Partial<Response> {
  const r: any = {};
  r.status = vi.fn().mockReturnValue(r);
  r.json = vi.fn().mockReturnValue(r);
  return r;
}

describe('PedidoProdutoController', () => {
  let ctrl: PedidoProdutoController;
  let svc: any;

  beforeEach(() => {
    svc = {
      create: vi.fn(), findAll: vi.fn(), findById: vi.fn(),
      findByIdPedido: vi.fn(), findByIdProduto: vi.fn(),
      update: vi.fn(), delete: vi.fn(), deleteByIdPedido: vi.fn(),
    };
    ctrl = new PedidoProdutoController(svc);
  });

  it('health', () => {
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    ctrl.health(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('create returns 201', async () => {
    svc.create.mockResolvedValue({ id: 'u' });
    const req = mockReq({ body: { id_pedido: '550e8400-e29b-41d4-a716-446655440000', id_produto: '550e8400-e29b-41d4-a716-446655440001', quantidade: 1, preco: 10, total: 10 } }) as Request;
    const res = mockRes() as Response;
    await ctrl.create(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('findAll returns 200', async () => {
    svc.findAll.mockResolvedValue([]);
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    await ctrl.findAll(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('findById returns 200', async () => {
    svc.findById.mockResolvedValue({ id: '1' });
    const req = mockReq({ params: { id: '1' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.findById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('findByIdPedido returns 200', async () => {
    svc.findByIdPedido.mockResolvedValue([]);
    const req = mockReq({ params: { idPedido: 'p1' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.findByIdPedido(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('findByIdProduto returns 200', async () => {
    svc.findByIdProduto.mockResolvedValue([]);
    const req = mockReq({ params: { idProduto: 'pr1' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.findByIdProduto(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('update returns 200', async () => {
    svc.update.mockResolvedValue({ id: '1' });
    const req = mockReq({ params: { id: '1' }, body: {} }) as Request;
    const res = mockRes() as Response;
    await ctrl.update(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('delete returns 200', async () => {
    svc.delete.mockResolvedValue(undefined);
    const req = mockReq({ params: { id: '1' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.delete(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteByIdPedido returns 200', async () => {
    svc.deleteByIdPedido.mockResolvedValue(undefined);
    const req = mockReq({ params: { idPedido: 'p1' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.deleteByIdPedido(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
