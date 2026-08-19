import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { CanalVendaController } from '../controllers/canalVendaController';

export function createCanalVendaRoutes(controller: CanalVendaController): Router {
  const router = Router();

  router.get('/health', controller.health);
  router.post('/sincronizar', asyncHandler(controller.sincronizar));
  router.get('/', asyncHandler(controller.findAll));
  router.get('/:id', asyncHandler(controller.findById));
  router.put('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.delete));

  return router;
}
