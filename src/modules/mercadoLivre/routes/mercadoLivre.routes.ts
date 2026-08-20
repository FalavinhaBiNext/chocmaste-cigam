import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { MercadoLivreController } from '../controllers/mercadoLivreController';

export function createMercadoLivreRoutes(controller: MercadoLivreController): Router {
  const router = Router();

  // Autenticação
  router.get('/auth-url', asyncHandler(controller.getAuthUrl));
  router.get('/callback', asyncHandler(controller.handleCallback));

  // Tokens
  router.get('/tokens', asyncHandler(controller.listTokens));
  router.delete('/tokens/:id', asyncHandler(controller.deleteToken));
  router.patch('/tokens/:id/activate', asyncHandler(controller.activateToken));

  // Dados do usuário
  router.get('/me', asyncHandler(controller.getMe));

  // Pedidos
  router.get('/orders', asyncHandler(controller.listOrders));
  router.get('/orders/:orderId', asyncHandler(controller.getOrder));

  // Shipments
  router.get('/shipments/:shipmentId/status', asyncHandler(controller.getShipmentStatus));

  return router;
}
