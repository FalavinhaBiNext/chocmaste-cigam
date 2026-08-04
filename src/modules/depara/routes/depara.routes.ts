import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { DeParaController } from '../controllers/deparaController';

export function createDeParaRoutes(controller: DeParaController): Router {
  const router = Router();

  router.get('/health', controller.health);
  router.post('/sync/produtos', asyncHandler(controller.syncProdutos));
  router.post('/sync/clientes', asyncHandler(controller.syncClientes));
  router.post('/sync/formas-pagamento', asyncHandler(controller.syncFormasPagamento));
  router.post('/sync/transportadoras', asyncHandler(controller.syncTransportadoras));
  router.post('/sync/all', asyncHandler(controller.syncAll));
  router.post('/manual', asyncHandler(controller.manualMap));
  router.get('/status', asyncHandler(controller.getStatus));
  router.get('/formas-pagamento/export-excel', asyncHandler(controller.exportFormasPagamento));
  router.get('/:entity', asyncHandler(controller.getAssociations));
  router.delete('/:entity/:id_bling', asyncHandler(controller.deleteAssociation));

  return router;
}
