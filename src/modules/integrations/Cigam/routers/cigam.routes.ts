import { Router } from "express";
import { asyncHandler } from "@/shared/middlewares/asyncHandler";
import { CigamController } from "../controllers/CigamController";

export function createCigamRoutes(controller: CigamController): Router {
    const router = Router();

    router.get('/health', controller.health)
    router.post('/auth/:id_empresa', controller.authenticate)

    return router
}