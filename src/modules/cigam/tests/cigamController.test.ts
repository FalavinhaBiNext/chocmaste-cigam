import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { CigamController } from '../controllers/cigamController';

function mockReq(o: any = {}): Partial<Request> {
  return { params: {}, body: {}, ...o };
}
function mockRes(): Partial<Response> {
  const r: any = {};
  r.status = vi.fn().mockReturnValue(r);
  r.json = vi.fn().mockReturnValue(r);
  return r;
}

describe('CigamController', () => {
  let ctrl: CigamController;
  let svc: any;
  let syncSvc: any;

  beforeEach(() => {
    svc = {
      authenticate: vi.fn(),
      getStatus: vi.fn(),
      manualSaveToken: vi.fn(),
    };

    syncSvc = {
      syncAll: vi.fn(),
      syncProdutos: vi.fn(),
      syncClientes: vi.fn(),
      syncFormasPagamento: vi.fn(),
      syncTransportadoras: vi.fn(),
    };

    ctrl = new CigamController(svc as any, syncSvc as any, { findAll: vi.fn().mockResolvedValue([]) } as any);
  });

  it('health', () => {
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    ctrl.health(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('authenticate', async () => {
    svc.authenticate.mockResolvedValue({ hash: 'abc' });
    const req = mockReq({ body: { ambiente: 'producao' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.authenticate(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('status', async () => {
    svc.getStatus.mockResolvedValue({ authenticated: true });
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    await ctrl.status(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('saveToken', async () => {
    const req = mockReq({ body: { hash: 'h', ambiente: 'producao' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.saveToken(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('syncAll', async () => {
    syncSvc.syncAll.mockResolvedValue({ entity: 'all', created: 0, updated: 0, errors: [] });
    const req = mockReq({ body: { ambiente: 'producao' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.syncAll(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('syncProdutos', async () => {
    syncSvc.syncProdutos.mockResolvedValue({ entity: 'produtos', created: 1, updated: 0, errors: [] });
    const req = mockReq({ body: { ambiente: 'producao' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.syncProdutos(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('syncClientes', async () => {
    syncSvc.syncClientes.mockResolvedValue({ entity: 'clientes', created: 2, updated: 0, errors: [] });
    const req = mockReq({ body: { ambiente: 'producao' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.syncClientes(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('syncFormasPagamento', async () => {
    syncSvc.syncFormasPagamento.mockResolvedValue({ entity: 'formas-pagamento', created: 0, updated: 1, errors: [] });
    const req = mockReq({ body: { ambiente: 'producao' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.syncFormasPagamento(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('syncTransportadoras', async () => {
    syncSvc.syncTransportadoras.mockResolvedValue({ entity: 'transportadoras', created: 0, updated: 0, errors: [] });
    const req = mockReq({ body: { ambiente: 'producao' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.syncTransportadoras(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
