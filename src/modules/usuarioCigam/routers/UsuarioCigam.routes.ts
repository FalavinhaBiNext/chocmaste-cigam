import { Router } from "express";
import { asyncHandler } from "@/shared/middlewares/asyncHandler";
import { UsuarioCigamController } from "../controllers/UsuarioCigamController";

export function createUsuarioCigamRoutes(controller: UsuarioCigamController): Router {
    const router = Router();

    router.get('/health', controller.health);
    router.post('/create', asyncHandler(controller.create))
    router.get('/find-all', asyncHandler(controller.findAll))
    router.put('/:id', asyncHandler(controller.update))
    router.delete('/:id', asyncHandler(controller.delete))
    router.patch('/alter-ativo/:id', asyncHandler(controller.alterAtivo))

    return router
}