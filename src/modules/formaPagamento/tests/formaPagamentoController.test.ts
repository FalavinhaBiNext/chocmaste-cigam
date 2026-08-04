import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { FormaPagamentoController } from '../controllers/formaPagamentoController';

function mockReq(o: any = {}): Partial<Request> {
  return { params: {}, body: {}, ...o };
}
function mockRes(): Partial<Response> {
  const r: any = {};
  r.status = vi.fn().mockReturnValue(r);
  r.json = vi.fn().mockReturnValue(r);
  return r;
}

describe('FormaPagamentoController', () => {
  let ctrl: FormaPagamentoController;
  let svc: any;

  beforeEach(() => {
    svc = { create: vi.fn(), findAll: vi.fn(), findById: vi.fn(), findByIdBling: vi.fn(), update: vi.fn(), delete: vi.fn() };
    ctrl = new FormaPagamentoController(svc);
  });

  it('health', () => {
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    ctrl.health(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('create returns 201', async () => {
    svc.create.mockResolvedValue({ id: 'u' });
    const req = mockReq({ body: { id_bling: 'b1', descricao: 'D' } }) as Request;
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

  it('findByIdBling returns 200', async () => {
    svc.findByIdBling.mockResolvedValue({ id: '1' });
    const req = mockReq({ params: { idBling: 'b1' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.findByIdBling(req, res);
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
});
