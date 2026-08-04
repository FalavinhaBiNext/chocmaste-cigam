import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { ProdutosCigamController } from '../controllers/produtosCigamController';

export function createProdutosCigamRoutes(controller: ProdutosCigamController): Router {
  const router = Router();

  router.get('/health', controller.health);
  router.post('/', asyncHandler(controller.create));
  router.get('/', asyncHandler(controller.findAll));
  router.get('/cigam/:idCigam', asyncHandler(controller.findByIdCigam));
  router.get('/:id', asyncHandler(controller.findById));
  router.put('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.delete));

  return router;
}
