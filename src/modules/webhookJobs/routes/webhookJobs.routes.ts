import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { ensureAuthenticated } from '@/shared/middlewares/ensureAuthenticated';
import { WebhookJobController } from '../controllers/webhookJobController';

export function createWebhookJobRoutes(controller: WebhookJobController): Router {
  const router = Router();

  // GET também exige login: a listagem devolve o payload recebido no webhook.
  router.get('/', ensureAuthenticated, asyncHandler(controller.findAll));
  router.post('/:id/reprocessar', asyncHandler(controller.reprocessar));

  return router;
}
