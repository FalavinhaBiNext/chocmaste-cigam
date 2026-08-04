import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { ensureBlingAuth } from '@/shared/middlewares/ensureBlingAuth';
import { verifyWebhookSignature } from '@/shared/middlewares/verifyWebhookSignature';
import { WebhookController } from '../controllers/webhookController';

export function createWebhookRoutes(controller: WebhookController): Router {
  const router = Router();

  router.post('/webhook/pedido', verifyWebhookSignature, ensureBlingAuth, asyncHandler(controller.handlePedidoCriado));
  router.post('/webhook-test', ensureBlingAuth, asyncHandler(controller.handlePedidoCriado));

  return router;
}