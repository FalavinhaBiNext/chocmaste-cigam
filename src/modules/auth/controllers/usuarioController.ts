import { injectable, inject } from 'tsyringe';
import { Request, Response } from "express";
import { UsuarioService } from '../services/usuarioService';
import { validateRegister, validateLogin } from '../usuario.validator';

@injectable()
export class UsuarioController {
    constructor(
        private readonly usuarioService: UsuarioService
    ) {}

    register = async (req: Request, res: Response) => {
        const input = validateRegister(req.body);
        const user = await this.usuarioService.register(input);
        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso.',
            data: user
        });
    }

    login = async (req: Request, res: Response) => {
        const input = validateLogin(req.body);
        const result = await this.usuarioService.login(input);
        res.status(200).json({
            success: true,
            message: 'Login realizado com sucesso.',
            data: result
        });
    }

    me = async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const user = await this.usuarioService.findById(userId);
        res.status(200).json({
            success: true,
            data: user
        });
    }

    list = async (_req: Request, res: Response) => {
        const users = await this.usuarioService.listAll();
        res.status(200).json({
            success: true,
            data: users
        });
    }
}
