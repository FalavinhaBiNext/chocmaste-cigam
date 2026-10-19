import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { PedidosBlingController } from '../controllers/pedidosBlingController';

export function createPedidosBlingRoutes(controller: PedidosBlingController): Router {
  const router = Router();

  router.get('/numero/:numero', asyncHandler(controller.getByNumero));
  router.get('/:id', asyncHandler(controller.getById));

  return router;
}
