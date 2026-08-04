import { inject, injectable } from 'tsyringe';
import { Request, Response } from "express";
import { BlingService } from '../services/blingService';
import { validateSaveToken } from '../bling.validator';
import { logger } from '@/shared/utils/logger';

@injectable()
export class BlingController {
  constructor(
    private readonly blingService: BlingService
  ) {}

  auth = (_req: Request, res: Response) => {
    const { url } = this.blingService.generateAuthURL();
    logger.auth('Redirecionando para autorização Bling');
    return res.redirect(url);
  };

  callback = async (req: Request, res: Response) => {
    const code = String(req.query.code ?? '');
    await this.blingService.handleCallback(code);
    return res.json({
      success: true,
      message: 'Autenticação Bling realizada com sucesso.'
    });
  };

  refresh = async (_req: Request, res: Response) => {
    await this.blingService.refreshToken();
    return res.json({
      success: true,
      message: 'Token Bling renovado com sucesso.'
    });
  };

  status = async (_req: Request, res: Response) => {
    const result = await this.blingService.getTokenStatus();
    return res.json({
      success: true,
      data: result
    });
  };

  saveToken = async (req: Request, res: Response) => {
    const input = validateSaveToken(req.body);
    await this.blingService.manualSaveToken(input);
    logger.success('Token Bling salvo manualmente');
    return res.status(201).json({
      success: true,
      message: 'Token Bling salvo com sucesso.'
    });
  };
}
