import { Router } from 'express';
import { asyncHandler } from '@/shared/middlewares/asyncHandler';
import { UsuarioController } from '../controllers/usuarioController';
import { ensureAuthenticated } from '@/shared/middlewares/ensureAuthenticated';

export function createAuthRoutes(controller: UsuarioController): Router {
    const router = Router();

    router.post('/register', asyncHandler(controller.register));
    router.post('/login', asyncHandler(controller.login));
    router.get('/me', ensureAuthenticated, asyncHandler(controller.me));

    return router;
}
