import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { BlingController } from '../controllers/blingController';

export function createBlingRoutes(controller: BlingController): Router {
  const router = Router();

  router.get('/auth', controller.auth);
  router.get('/callback', asyncHandler(controller.callback));
  router.post('/refresh', asyncHandler(controller.refresh));
  router.get('/status', asyncHandler(controller.status));

  return router;
}
