import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { TrayController } from '../controllers/trayController';

export function createTrayRoutes(controller: TrayController): Router {
  const router = Router();

  // Autenticação
  router.get('/auth-url', asyncHandler(controller.getAuthUrl));
  router.get('/callback', asyncHandler(controller.handleCallback));

  // Tokens
  router.get('/tokens', asyncHandler(controller.listTokens));
  router.post('/tokens/:id/refresh', asyncHandler(controller.refreshToken));
  router.patch('/tokens/:id/activate', asyncHandler(controller.activateToken));
  router.delete('/tokens/:id', asyncHandler(controller.deleteToken));

  // Loja
  router.get('/info', asyncHandler(controller.getStoreInfo));

  return router;
}
