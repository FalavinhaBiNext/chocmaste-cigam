import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { CigamController } from '../controllers/cigamController';
import { CigamWebhookController } from '../controllers/cigamWebhookController';

export function createCigamRoutes(
  controller: CigamController,
  webhookController: CigamWebhookController
): Router {
  const router = Router();

  router.get('/health', controller.health);
  router.post('/auth', asyncHandler(controller.authenticate));
  router.get('/status', asyncHandler(controller.status));
  router.post('/token', asyncHandler(controller.saveToken));
  router.post('/sync', asyncHandler(controller.syncAll));
  router.post('/sync/produtos', asyncHandler(controller.syncProdutos));
  router.post('/sync/clientes', asyncHandler(controller.syncClientes));
  router.post('/sync/formas-pagamento', asyncHandler(controller.syncFormasPagamento));
  router.post('/sync/transportadoras', asyncHandler(controller.syncTransportadoras));

  // Novo endpoint de Webhook CIGAM (Fluxo reverso de cadastro de produtos)
  router.post('/webhook/produto', asyncHandler(webhookController.handleProdutoCriado));

  return router;
}