import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { EventController } from '../controllers/eventController';

export function createEventRoutes(controller: EventController): Router {
  const router = Router();

  router.get('/health', controller.health);
  router.post('/', asyncHandler(controller.create));
  router.get('/', asyncHandler(controller.findAll));
  router.get('/pedido/:pedido', asyncHandler(controller.findByPedido));
  router.get('/numero-pedido/:numero', asyncHandler(controller.findByNumeroPedido));
  router.get('/:id', asyncHandler(controller.findById));

  return router;
}
