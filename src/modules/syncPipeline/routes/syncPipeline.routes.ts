import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { SyncPipelineController } from '../controllers/syncPipelineController';

export function createSyncPipelineRoutes(controller: SyncPipelineController): Router {
  const router = Router();

  router.get('/', asyncHandler(controller.getSummary));

  return router;
}
