import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlingProdutoSyncController } from '../controllers/blingProdutoSyncController';
import { Request, Response } from 'express';

function makeController(mocks: any = {}) {
  const syncService = {
    salvarProduto: vi.fn().mockResolvedValue({
      id: 'local-uuid-1',
      id_bling: '16566745325',
      nome: 'Produto Teste',
      preco: 100,
      temVariacoes: false,
      ativo: true,
    }),
    salvarProdutos: vi.fn().mockResolvedValue({ criados: 2, atualizados: 0, erros: [] }),
    sincronizarTodos: vi.fn().mockResolvedValue({ criados: 5, atualizados: 3, erros: [] }),
    sincronizarTodosComFila: vi.fn().mockResolvedValue({ criados: 5, atualizados: 3, erros: [] }),
    ...mocks.syncService,
  };

  const controller = new BlingProdutoSyncController(syncService as any);

  return { controller, mocks: { syncService } };
}

function makeReqRes(body: any = {}) {
  const req = { body } as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    flushHeaders: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
  } as unknown as Response;
  return { req, res };
}

describe('BlingProdutoSyncController', () => {
  describe('health', () => {
    it('should return 200 with status ok', () => {
      const { controller } = makeController();
      const { req, res } = makeReqRes();

      controller.health(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: 'ok',
          service: 'bling-produto-sync',
        }),
      );
    });
  });

  describe('salvarProduto', () => {
    it('should save product and return 201', async () => {
      const { controller, mocks } = makeController();
      const { req, res } = makeReqRes({ id_bling: '16566745325' });

      await controller.salvarProduto(req, res);

      expect(mocks.syncService.salvarProduto).toHaveBeenCalledWith('16566745325');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Produto salvo com sucesso.',
          data: expect.objectContaining({
            id: 'local-uuid-1',
            nome: 'Produto Teste',
          }),
        }),
      );
    });

    it('should throw ValidationError when id_bling is missing', async () => {
      const { controller } = makeController();
      const { req, res } = makeReqRes({});

      await expect(controller.salvarProduto(req, res)).rejects.toThrow('Dados inválidos');
    });

    it('should throw ValidationError when id_bling is empty', async () => {
      const { controller } = makeController();
      const { req, res } = makeReqRes({ id_bling: '' });

      await expect(controller.salvarProduto(req, res)).rejects.toThrow('Dados inválidos');
    });

    it('should propagate service errors', async () => {
      const { controller } = makeController({
        syncService: {
          salvarProduto: vi.fn().mockRejectedValue(new Error('Bling API timeout')),
        },
      });
      const { req, res } = makeReqRes({ id_bling: '123' });

      await expect(controller.salvarProduto(req, res)).rejects.toThrow('Bling API timeout');
    });
  });

  describe('salvarProdutos', () => {
    it('should save multiple products and return 200', async () => {
      const { controller, mocks } = makeController();
      const { req, res } = makeReqRes({ ids_bling: ['111', '222', '333'] });

      await controller.salvarProdutos(req, res);

      expect(mocks.syncService.salvarProdutos).toHaveBeenCalledWith(['111', '222', '333']);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ criados: 2 }),
        }),
      );
    });

    it('should throw ValidationError when ids_bling is empty', async () => {
      const { controller } = makeController();
      const { req, res } = makeReqRes({ ids_bling: [] });

      await expect(controller.salvarProdutos(req, res)).rejects.toThrow('Dados inválidos');
    });

    it('should throw ValidationError when ids_bling is missing', async () => {
      const { controller } = makeController();
      const { req, res } = makeReqRes({});

      await expect(controller.salvarProdutos(req, res)).rejects.toThrow('Dados inválidos');
    });
  });

  describe('sincronizarTodos', () => {
    it('should sync all products and return 200', async () => {
      const { controller, mocks } = makeController();
      const { req, res } = makeReqRes();

      await controller.sincronizarTodos(req, res);

      expect(mocks.syncService.sincronizarTodosComFila).toHaveBeenCalled();
      expect(res.write).toHaveBeenCalled();
    });

    it('should propagate service errors', async () => {
      const { controller } = makeController({
        syncService: {
          sincronizarTodosComFila: vi.fn().mockRejectedValue(new Error('Connection refused')),
        },
      });
      const { req, res } = makeReqRes();

      await controller.sincronizarTodos(req, res);

      expect(res.write).toHaveBeenCalled();
    });
  });
});
