import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { TransportadoraController } from '../controllers/transportadoraController';

export function createTransportadoraRoutes(controller: TransportadoraController): Router {
  const router = Router();

  router.get('/health', controller.health);
  router.post('/', asyncHandler(controller.create));
  router.post('/importar-bling', asyncHandler(controller.importarDoBling));
  router.get('/', asyncHandler(controller.findAll));
  router.get('/bling/:idBling', asyncHandler(controller.findByIdBling));
  router.get('/:id', asyncHandler(controller.findById));
  router.put('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.delete));

  return router;
}
