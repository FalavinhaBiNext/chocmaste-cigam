import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { BlingController } from '../controllers/blingController';
import { BlingTokenController } from '../controllers/blingTokenController';
import { validateCallbackQuery } from '../bling.validator';

export function createBlingRoutes(controller: BlingController, tokenController: BlingTokenController): Router {
  const router = Router();

  router.get('/auth', controller.auth);
  router.get('/callback', validateCallbackQuery, asyncHandler(controller.callback));
  router.post('/refresh', asyncHandler(controller.refresh));
  router.get('/status', asyncHandler(controller.status));
  router.post('/token', asyncHandler(controller.saveToken));
  router.post('/token/schedule', asyncHandler(tokenController.schedule));

  // Endpoints para gerenciamento de múltiplas contas
  router.get('/tokens', asyncHandler(controller.listTokens));
  router.post('/tokens/:id/activate', asyncHandler(controller.activateToken));
  router.patch('/tokens/:id', asyncHandler(controller.updateToken));
  router.delete('/tokens/:id', asyncHandler(controller.deleteToken));

  return router;
}
