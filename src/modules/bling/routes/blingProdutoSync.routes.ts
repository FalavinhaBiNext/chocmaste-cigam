import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { BlingProdutoSyncController } from '../controllers/blingProdutoSyncController';

export function createBlingProdutoSyncRoutes(
  controller: BlingProdutoSyncController,
): Router {
  const router = Router();

  router.get('/health', controller.health);
  router.post('/salvar', asyncHandler(controller.salvarProduto));
  router.post('/salvar-varios', asyncHandler(controller.salvarProdutos));
  router.post('/sincronizar-todos', asyncHandler(controller.sincronizarTodos));
  router.post('/sincronizar-fila', asyncHandler(controller.sincronizarTodosComFila));

  return router;
}
