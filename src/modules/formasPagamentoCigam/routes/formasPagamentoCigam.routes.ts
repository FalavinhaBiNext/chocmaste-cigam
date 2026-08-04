import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { FormasPagamentoCigamController } from '../controllers/formasPagamentoCigamController';

export function createFormasPagamentoCigamRoutes(controller: FormasPagamentoCigamController): Router {
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
