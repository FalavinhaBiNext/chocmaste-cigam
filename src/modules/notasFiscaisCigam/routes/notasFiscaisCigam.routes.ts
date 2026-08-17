import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { uploadXml } from '@/shared/middlewares/uploadXml';
import { NotasFiscaisCigamController } from '../controllers/notasFiscaisCigamController';

export function createNotasFiscaisCigamRoutes(
  controller: NotasFiscaisCigamController
): Router {
  const router = Router();

  // POST - aceita upload de arquivo XML via multipart/form-data
  router.post('/', uploadXml, asyncHandler(controller.receberWebhook));

  // GET - rotas de consulta
  router.get('/', asyncHandler(controller.listarNotas));
  router.get('/nao-enviadas', asyncHandler(controller.listarNotEnviadas));
  router.get('/:id', asyncHandler(controller.buscarPorId));
  router.patch('/:id/enviar', asyncHandler(controller.marcarEnviada));

  return router;
}
