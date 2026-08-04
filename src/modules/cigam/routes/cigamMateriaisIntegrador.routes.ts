import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { CigamMateriaisIntegradorController } from '../controllers/cigamMateriaisIntegradorController';

export function createCigamMateriaisIntegradorRoutes(
  controller: CigamMateriaisIntegradorController,
): Router {
  const router = Router();

  router.get('/health', controller.health);
  router.post('/cadastrar', asyncHandler(controller.cadastrarMaterial));
  router.get('/listar', asyncHandler(controller.listarMateriais));
  router.post('/sincronizar', asyncHandler(controller.sincronizarComLocal));
  router.post('/cadastrar-emapear', asyncHandler(controller.cadastrarEmapear));

  return router;
}
