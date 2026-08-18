import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { ShopeeController } from '../controllers/shopeeController';

export function createShopeeRoutes(controller: ShopeeController): Router {
  const router = Router();

  // Autenticação
  router.get('/auth-url', asyncHandler(controller.getAuthUrl));
  router.get('/callback', asyncHandler(controller.handleCallback));

  // Tokens
  router.get('/tokens', asyncHandler(controller.listTokens));
  router.delete('/tokens/:id', asyncHandler(controller.deleteToken));
  router.patch('/tokens/:id/activate', asyncHandler(controller.activateToken));

  return router;
}
