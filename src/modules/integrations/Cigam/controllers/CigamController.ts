import { Request, Response } from "express";
import { CigamAuthService } from "../services/CigamAuth";
import { injectable } from "tsyringe";

@injectable()
export class CigamController {
    constructor(
        private readonly cigamAuthService: CigamAuthService
    ) {}

    health = async(req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            status: 'ok', 
            service: 'Cigam Service',
            message: 'Cigam Service Running',
            timestamp: new Date().toISOString()
        })
    }

    authenticate = async(req: Request, res: Response) => {
        const { id_empresa } = req.params
        const cigam = await this.cigamAuthService.authenticate(String(id_empresa))

        res.status(200).json({
            success: true,
            message: 'Authenticate success',
            data: cigam
        })
    }
}