import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { PedidoController } from '../controllers/pedidoController';
import { NotFoundError } from '@/shared/errors/AppError';

function mockReq(overrides: Record<string, any> = {}): Partial<Request> {
  return {
    params: {},
    body: {},
    ...overrides,
  };
}

function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('PedidoController', () => {
  let controller: PedidoController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      findByIdBling: vi.fn(),
      findByNumeroLoja: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    controller = new PedidoController(mockService);
  });

  describe('health', () => {
    it('should return 200 with service status', () => {
      const req = mockReq() as Request;
      const res = mockRes() as Response;
      controller.health(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, service: 'pedido' })
      );
    });
  });

  describe('create', () => {
    it('should return 201 on success', async () => {
      const input = {
        id_bling: 'bling-123',
        codigo_curto: 'CC-001',
        numero_loja: 'LOJA-001',
        data_pedido: '2024-01-15',
        total_produtos: 100.50,
        total_venda: 120.00,
        id_cliente_bling: 'cliente-001',
        nome_cliente: 'João Silva',
        documento_cliente: '12345678901',
        tipo_pessoa: 'F',
        id_loja: 'loja-01',
        desconto: 10.00,
        quantidade_itens: 3,
        status_venda: 'em_andamento',
        codigo_transportadora: 'transp-001',
        valor_frete: 15.50,
        nome_transportadora: 'Transportadora XYZ',
        codigo_rastreio: 'BR123456789',
      };
      const output = { id: 'uuid', ...input };
      mockService.create.mockResolvedValue(output);
      const req = mockReq({ body: input }) as Request;
      const res = mockRes() as Response;

      await controller.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: output })
      );
    });
  });

  describe('findAll', () => {
    it('should return 200 with list', async () => {
      mockService.findAll.mockResolvedValue([{ id: '1' }]);
      const req = mockReq() as Request;
      const res = mockRes() as Response;

      await controller.findAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('findById', () => {
    it('should return 200 when found', async () => {
      mockService.findById.mockResolvedValue({ id: '123' });
      const req = mockReq({ params: { id: '123' } }) as Request;
      const res = mockRes() as Response;

      await controller.findById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should throw when not found', async () => {
      mockService.findById.mockRejectedValue(new NotFoundError('não encontrado'));
      const req = mockReq({ params: { id: '999' } }) as Request;
      const res = mockRes() as Response;

      await expect(controller.findById(req, res)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByIdBling', () => {
    it('should return 200 when found', async () => {
      mockService.findByIdBling.mockResolvedValue({ id: '123', id_bling: 'bling-1' });
      const req = mockReq({ params: { idBling: 'bling-1' } }) as Request;
      const res = mockRes() as Response;

      await controller.findByIdBling(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('findByNumeroLoja', () => {
    it('should return 200 when found', async () => {
      mockService.findByNumeroLoja.mockResolvedValue({ id: '123', numero_loja: 'LOJA-001' });
      const req = mockReq({ params: { numeroLoja: 'LOJA-001' } }) as Request;
      const res = mockRes() as Response;

      await controller.findByNumeroLoja(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('update', () => {
    it('should return 200 on success', async () => {
      mockService.update.mockResolvedValue({ id: '123', nome_cliente: 'Maria' });
      const req = mockReq({ params: { id: '123' }, body: { nome_cliente: 'Maria' } }) as Request;
      const res = mockRes() as Response;

      await controller.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delete', () => {
    it('should return 200 on success', async () => {
      mockService.delete.mockResolvedValue(undefined);
      const req = mockReq({ params: { id: '123' } }) as Request;
      const res = mockRes() as Response;

      await controller.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Pedido deleted successfully' })
      );
    });
  });
});
