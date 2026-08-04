import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { ClientesCigamController } from '../controllers/clientesCigamController';

function mockReq(o: any = {}): Partial<Request> {
  return { params: {}, body: {}, ...o };
}
function mockRes(): Partial<Response> {
  const r: any = {};
  r.status = vi.fn().mockReturnValue(r);
  r.json = vi.fn().mockReturnValue(r);
  return r;
}

describe('ClientesCigamController', () => {
  let ctrl: ClientesCigamController;
  let svc: any;

  beforeEach(() => {
    svc = { create: vi.fn(), findAll: vi.fn(), findById: vi.fn(), findByIdCigam: vi.fn(), update: vi.fn(), delete: vi.fn() };
    ctrl = new ClientesCigamController(svc);
  });

  it('health', () => {
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    ctrl.health(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('create returns 201', async () => {
    svc.create.mockResolvedValue({ id: 'u' });
    const req = mockReq({ body: { id_cigam: 'cc1', nome: 'Maria' } }) as Request;
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

  it('findByIdCigam returns 200', async () => {
    svc.findByIdCigam.mockResolvedValue({ id: '1' });
    const req = mockReq({ params: { idCigam: 'cc1' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.findByIdCigam(req, res);
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
