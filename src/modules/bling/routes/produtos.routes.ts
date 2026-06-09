import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { ProdutosController } from '../controllers/produtosController';

export function createProdutosRoutes(controller: ProdutosController): Router {
  const router = Router();

  router.get('/:idProduto', asyncHandler(controller.getById));

  return router;
}
