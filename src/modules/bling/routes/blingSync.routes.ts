import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { BlingSyncController } from '../controllers/blingSyncController';

export function createBlingSyncRoutes(controller: BlingSyncController): Router {
  const router = Router();

  router.post('/produtos', asyncHandler(controller.syncProdutos));
  router.post('/clientes', asyncHandler(controller.syncClientes));
  router.post('/formas-pagamento', asyncHandler(controller.syncFormasPagamento));
  router.post('/transportadoras', asyncHandler(controller.syncTransportadoras));
  router.post('/all', asyncHandler(controller.syncAll));

  return router;
}
