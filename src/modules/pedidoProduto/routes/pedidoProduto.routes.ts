import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { PedidoProdutoController } from '../controllers/pedidoProdutoController';

export function createPedidoProdutoRoutes(controller: PedidoProdutoController): Router {
  const router = Router();

  router.get('/health', controller.health);
  router.post('/', asyncHandler(controller.create));
  router.get('/', asyncHandler(controller.findAll));
  router.get('/pedido/:idPedido', asyncHandler(controller.findByIdPedido));
  router.get('/produto/:idProduto', asyncHandler(controller.findByIdProduto));
  router.get('/:id', asyncHandler(controller.findById));
  router.put('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.delete));
  router.delete('/pedido/:idPedido', asyncHandler(controller.deleteByIdPedido));

  return router;
}
