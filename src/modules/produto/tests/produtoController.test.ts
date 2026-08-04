import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { ProdutoController } from '../controllers/produtoController';
import { NotFoundError } from '@/shared/errors/AppError';

function mockReq(overrides: Record<string, any> = {}): Partial<Request> {
  return { params: {}, body: {}, ...overrides };
}

function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('ProdutoController', () => {
  let controller: ProdutoController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      create: vi.fn(), findAll: vi.fn(), findById: vi.fn(),
      findByIdBling: vi.fn(), findByIdProduto: vi.fn(),
      update: vi.fn(), delete: vi.fn(),
    };
    controller = new ProdutoController(mockService);
  });

  it('health returns 200', () => {
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    controller.health(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('create returns 201', async () => {
    mockService.create.mockResolvedValue({ id: 'uuid' });
    const req = mockReq({ body: { nome: 'Choco', preco: 10 } }) as Request;
    const res = mockRes() as Response;
    await controller.create(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('findAll returns 200', async () => {
    mockService.findAll.mockResolvedValue([]);
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    await controller.findAll(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('findById returns 200', async () => {
    mockService.findById.mockResolvedValue({ id: '123' });
    const req = mockReq({ params: { id: '123' } }) as Request;
    const res = mockRes() as Response;
    await controller.findById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('findByIdBling returns 200', async () => {
    mockService.findByIdBling.mockResolvedValue({ id: '123' });
    const req = mockReq({ params: { idBling: 'bling-1' } }) as Request;
    const res = mockRes() as Response;
    await controller.findByIdBling(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('findByIdProduto returns 200', async () => {
    mockService.findByIdProduto.mockResolvedValue({ id: '123' });
    const req = mockReq({ params: { idProduto: 'prod-001' } }) as Request;
    const res = mockRes() as Response;
    await controller.findByIdProduto(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('update returns 200', async () => {
    mockService.update.mockResolvedValue({ id: '123' });
    const req = mockReq({ params: { id: '123' }, body: { nome: 'Novo' } }) as Request;
    const res = mockRes() as Response;
    await controller.update(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('delete returns 200', async () => {
    mockService.delete.mockResolvedValue(undefined);
    const req = mockReq({ params: { id: '123' } }) as Request;
    const res = mockRes() as Response;
    await controller.delete(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('findById propagates error', async () => {
    mockService.findById.mockRejectedValue(new NotFoundError(''));
    const req = mockReq({ params: { id: '999' } }) as Request;
    const res = mockRes() as Response;
    await expect(controller.findById(req, res)).rejects.toThrow(NotFoundError);
  });
});
