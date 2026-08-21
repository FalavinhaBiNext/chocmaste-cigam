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

  // Pedidos
  router.get('/orders', asyncHandler(controller.listOrders));
  router.post('/orders/:orderSn/send-invoice', asyncHandler(controller.sendInvoice));
  router.get('/orders/:orderSn/shipment-status', asyncHandler(controller.getShipmentStatus));
  router.get('/orders/:orderSn', asyncHandler(controller.getOrder));

  return router;
}
