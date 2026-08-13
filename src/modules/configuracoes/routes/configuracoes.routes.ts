import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { ConfiguracoesController } from '../controllers/configuracoesController';

export function createConfiguracoesRoutes(controller: ConfiguracoesController): Router {
  const router = Router();

  router.get('/envio-automatico', asyncHandler(controller.getEnvioAutomatico));
  router.patch('/envio-automatico', asyncHandler(controller.setEnvioAutomatico));

  return router;
}
