import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { IntegrationController } from '../controllers/integrationController';

export function createIntegrationsRoutes(controller: IntegrationController): Router {
  const router = Router();

  router.get('/health', asyncHandler(controller.getHealth));

  return router;
}
