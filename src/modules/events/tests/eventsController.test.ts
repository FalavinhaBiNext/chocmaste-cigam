import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { EventController } from '../controllers/eventController';

function mockReq(o: any = {}): Partial<Request> {
  return { params: {}, body: {}, query: {}, ...o };
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
  let webhookSvc: any;
  let blingHttpClient: any;
  let cigamPedidoService: any;
  let deParaUnidadesNegocioRepo: any;

  beforeEach(() => {
    svc = { create: vi.fn(), findAll: vi.fn(), findById: vi.fn(), findByPedido: vi.fn(), findByNumeroPedido: vi.fn(), delete: vi.fn(), markSyncSuccess: vi.fn(), markSyncFailure: vi.fn() };
    webhookSvc = { processarPedidoCriado: vi.fn() };
    blingHttpClient = { getPedido: vi.fn() };
    cigamPedidoService = { enviarPedido: vi.fn() };
    deParaUnidadesNegocioRepo = { findByCompanyIdBling: vi.fn() };
    ctrl = new EventController(svc as any, webhookSvc, blingHttpClient, cigamPedidoService, deParaUnidadesNegocioRepo);
  });

  it('health', () => {
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    ctrl.health(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('create calls webhookService and returns 201', async () => {
    webhookSvc.processarPedidoCriado = vi.fn().mockResolvedValue('CIGAM-1');
    const body = {
      eventId: '550e8400-e29b-41d4-a716-446655440000',
      event: 'order.created',
      companyId: 'c1',
      data: {
        id: 123,
        numero: 1001,
        numeroLoja: 'LOJA-001',
        total: 250,
      }
    };
    const req = mockReq({ body }) as Request;
    const res = mockRes() as Response;
    await ctrl.create(req, res);
    expect(webhookSvc.processarPedidoCriado).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('findAll returns 200', async () => {
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    await ctrl.findAll(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(svc.findAll).toHaveBeenCalledWith(undefined);
  });

  it('findAll forwards sync_status=falha to the service', async () => {
    const req = mockReq({ query: { sync_status: 'falha' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.findAll(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(svc.findAll).toHaveBeenCalledWith('falha');
  });

  it('findAll rejects an invalid sync_status', async () => {
    const req = mockReq({ query: { sync_status: 'invalido' } }) as Request;
    const res = mockRes() as Response;
    await expect(ctrl.findAll(req, res)).rejects.toThrow();
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

  it('retryCigamSync returns 404 when event not found', async () => {
    svc.findById.mockResolvedValue(null);
    const req = mockReq({ params: { id: 'evt-404' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.retryCigamSync(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Evento não encontrado.' }));
  });

  it('retryCigamSync returns 400 when event is already synchronized', async () => {
    svc.findById.mockResolvedValue({ id: 'evt-1', cigam_sincronizado: true });
    const req = mockReq({ params: { id: 'evt-1' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.retryCigamSync(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Este pedido já foi sincronizado com o CIGAM.' }));
  });

  it('retryCigamSync returns 409 when concurrent retry for same event is in progress', async () => {
    let resolveFirst: any;
    const slowPromise = new Promise((resolve) => { resolveFirst = resolve; });
    svc.findById.mockImplementation(async () => {
      await slowPromise;
      return { id: 'evt-lock', cigam_sincronizado: false, pedido_id: 123 };
    });

    const req1 = mockReq({ params: { id: 'evt-lock' } }) as Request;
    const res1 = mockRes() as Response;
    const firstCall = ctrl.retryCigamSync(req1, res1);

    const req2 = mockReq({ params: { id: 'evt-lock' } }) as Request;
    const res2 = mockRes() as Response;
    await ctrl.retryCigamSync(req2, res2);

    expect(res2.status).toHaveBeenCalledWith(409);
    expect(res2.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'A sincronização deste evento já está em processamento.',
    }));

    resolveFirst();
    try { await firstCall; } catch {}
  });

  it('retryCigamSync prioriza unidade de negocio da loja do pedido Bling sobre company_id', async () => {
    svc.findById.mockResolvedValue({
      id: 'evt-retry-1',
      cigam_sincronizado: false,
      pedido_id: 74996,
      company_id: 'tenant-matriz'
    });
    blingHttpClient.getPedido.mockResolvedValue({
      data: {
        id: 74996,
        loja: {
          id: 203345026,
          unidadeNegocio: { id: 941369 }
        }
      }
    });
    deParaUnidadesNegocioRepo.findByCompanyIdBling.mockImplementation((id: string) => {
      if (id === '941369') return Promise.resolve({ unidade_negocio: '002' });
      if (id === 'tenant-matriz') return Promise.resolve({ unidade_negocio: '001' });
      return Promise.resolve(null);
    });
    cigamPedidoService.enviarPedido.mockResolvedValue('CIGAM-002');

    const req = mockReq({ params: { id: 'evt-retry-1' } }) as Request;
    const res = mockRes() as Response;
    await ctrl.retryCigamSync(req, res);

    expect(cigamPedidoService.enviarPedido).toHaveBeenCalledWith(
      expect.anything(),
      '002',
      undefined,
      undefined,
      'evt-retry-1'
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
