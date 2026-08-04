import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { EventController } from '../controllers/eventController';

function mockReq(o: any = {}): Partial<Request> {
  return { params: {}, body: {}, ...o };
}
function mockRes(): Partial<Response> {
  const r: any = {};
  r.status = vi.fn().mockReturnValue(r);
  r.json = vi.fn().mockReturnValue(r);
  return r;
}

describe('EventController', () => {
  let ctrl: EventController;
  let svc: any;

  beforeEach(() => {
    svc = { create: vi.fn(), findAll: vi.fn(), findById: vi.fn(), findByPedido: vi.fn(), findByNumeroPedido: vi.fn() };
    ctrl = new EventController(svc as any);
  });

  it('health', () => {
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    ctrl.health(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('create calls service and returns 201', async () => {
    svc.create.mockResolvedValue({ id: 'uuid' });
    const body = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      event: 'order.created',
      company_id: 'c1',
      pedido_id: 123,
      numero_pedido: 1001,
      numero_loja: 'LOJA-001',
      total_pedido: 250,
    };
    const req = mockReq({ body }) as Request;
    const res = mockRes() as Response;
    await ctrl.create(req, res);
    expect(svc.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('findAll returns 200', async () => {
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

  it('findByPedido returns 200', async () => {
    svc.findByPedido.mockResolvedValue({ pedido_id: 123 });
    const req = mockReq({ params: { pedido: '123' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.findByPedido(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('findByNumeroPedido returns 200', async () => {
    svc.findByNumeroPedido.mockResolvedValue({ numero_pedido: 1001 });
    const req = mockReq({ params: { numero: '1001' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.findByNumeroPedido(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
