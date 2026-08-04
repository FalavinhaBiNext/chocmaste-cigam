import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { ProdutoController } from '../controllers/produtoController';

export function createProdutoRoutes(controller: ProdutoController): Router {
  const router = Router();

  router.get('/health', controller.health);
  router.post('/', asyncHandler(controller.create));
  router.get('/', asyncHandler(controller.findAll));
  router.get('/export-excel', asyncHandler(controller.exportExcel));
  router.get('/bling/:idBling', asyncHandler(controller.findByIdBling));
  router.get('/id-produto/:idProduto', asyncHandler(controller.findByIdProduto));
  router.get('/:id', asyncHandler(controller.findById));
  router.put('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.delete));

  return router;
}
