import { injectable } from "tsyringe";
import { Request, Response } from "express";
import { UsuarioCigamService } from "../services/usuarioCigamService";

@injectable()
export class UsuarioCigamController {
    constructor(
        private readonly usuarioCigamService: UsuarioCigamService
    ) {}

    health = async(req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            status: 'ok',
            service: 'usuario cigam',
            message: 'Usuario Cigam Service Running',
            timestamp: new Date().toISOString()
        })
    }

    create = async(req: Request, res: Response) => {
        const payload = req.body
        const data = await this.usuarioCigamService.create(payload)
        
        res.status(200).json({
            success: true,
            message: 'Usuario Cigam Created successfully',
            data: data
        })
    }

    findAll = async(req: Request, res: Response) => {
        const data = await this.usuarioCigamService.findAll();

        res.status(200).json({
            success: true,
            message: 'Usuario Cigam Retrevied successfully',
            data: data
        })
    }

    update = async(req: Request, res: Response) => {
        const id = String(req.params.id);
        const payload = req.body
        await this.usuarioCigamService.update(id, payload)
        
        res.status(200).json({
            success: true,
            message: 'Usuario Cigam updated successfully'
        })
    }

    delete = async(req: Request, res: Response) => {
        const id = String(req.params.id);
        await this.usuarioCigamService.delete(id)
        
        res.status(200).json({
            success: true,
            message: 'Usuario Cigam deleted successfully'
        })
    }

    alterAtivo = async(req: Request, res: Response) => {
        const id = String(req.params.id);
        await this.usuarioCigamService.alterAtivo(id)
        
        res.status(200).json({
            success: true,
            message: 'Usuario Cigam active altered successfully'
        })
    }
}
