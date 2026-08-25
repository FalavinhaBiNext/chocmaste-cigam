import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { IntegrationController } from '../controllers/integrationController';

function mockRes(): Partial<Response> {
  const r: any = {};
  r.status = vi.fn().mockReturnValue(r);
  r.json = vi.fn().mockReturnValue(r);
  return r;
}

describe('IntegrationController', () => {
  it('getHealth returns 200 with the data from the service', async () => {
    const svc = { getHealth: vi.fn().mockResolvedValue([{ integration: 'bling', connected: true, status: 'ok' }]) };
    const ctrl = new IntegrationController(svc as any);
    const req = {} as Request;
    const res = mockRes() as Response;

    await ctrl.getHealth(req, res);

    expect(svc.getHealth).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: [{ integration: 'bling', connected: true, status: 'ok' }],
    }));
  });
});
