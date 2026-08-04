import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { ContatosController } from '../controllers/contatosController';

export function createContatosRoutes(controller: ContatosController): Router {
  const router = Router();

  router.get('/', asyncHandler(controller.search));
  router.get('/:id', asyncHandler(controller.getById));

  return router;
}
