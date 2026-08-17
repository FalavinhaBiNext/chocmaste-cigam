import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { NotasFiscaisCigamController } from '../controllers/notasFiscaisCigamController';

export function createNotasFiscaisCigamRoutes(
  controller: NotasFiscaisCigamController
): Router {
  const router = Router();

  router.post('/', asyncHandler(controller.receberWebhook));
  router.get('/', asyncHandler(controller.listarNotas));
  router.get('/nao-enviadas', asyncHandler(controller.listarNotEnviadas));
  router.get('/:id', asyncHandler(controller.buscarPorId));
  router.patch('/:id/enviar', asyncHandler(controller.marcarEnviada));

  return router;
}
