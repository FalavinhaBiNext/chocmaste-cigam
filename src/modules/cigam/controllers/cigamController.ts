import { inject, injectable } from 'tsyringe';
import { Request, Response } from "express";
import { CigamService } from '../services/cigamService';
import { CigamSyncService } from '../services/cigamSyncService';
import { validateAuthenticate, validateSaveToken, validateSync } from '../cigam.validator';
import { logger } from '@/shared/utils/logger';
import { UsuarioCigamService } from '@/modules/usuarioCigam/services/usuarioCigamService';

@injectable()
export class CigamController {
  constructor(
    @inject(CigamService) private readonly cigamService: CigamService,
    @inject(CigamSyncService) private readonly cigamSyncService: CigamSyncService,
    @inject(UsuarioCigamService) private readonly usuarioCigamService: UsuarioCigamService
  ) {}

  private async getEnv(ambiente?: string): Promise<string> {
    if (ambiente) return ambiente;
    
    // 1. Prioritize configured active user/environment (selected via UI environment switch)
    const usuarios = await this.usuarioCigamService.findAll();
    const ativo = usuarios.find(u => u.ativo);
    if (ativo) {
      return ativo.ambiente;
    }
    
    // 2. Fallback: Check if there is an active session
    const status = await this.cigamService.getStatus();
    if (status.authenticated && status.ambiente) {
      return status.ambiente;
    }
    
    // If absolutely none, default to homologacao
    return 'homologacao';
  }

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'cigam',
      message: 'Cigam Service Running',
      timestamp: new Date().toISOString()
    });
  };

  authenticate = async (req: Request, res: Response) => {
    const input = validateAuthenticate(req.body);
    const result = await this.cigamService.authenticate(input.ambiente);

    res.status(200).json({
      success: true,
      message: 'Autenticação Cigam realizada com sucesso.',
      data: result
    });
  };

  status = async (_req: Request, res: Response) => {
    const result = await this.cigamService.getStatus();

    res.status(200).json({
      success: true,
      data: result
    });
  };

  saveToken = async (req: Request, res: Response) => {
    const input = validateSaveToken(req.body);
    await this.cigamService.manualSaveToken(input);

    res.status(201).json({
      success: true,
      message: 'Hash Cigam salvo com sucesso.'
    });
  };

  syncAll = async (req: Request, res: Response) => {
    const input = validateSync(req.body);
    const env = await this.getEnv(input.ambiente);
    const result = await this.cigamSyncService.syncAll(env);

    res.status(200).json({
      success: true,
      message: 'Sincronização completa finalizada.',
      data: result,
    });
  };

  syncProdutos = async (req: Request, res: Response) => {
    const input = validateSync(req.body);
    const env = await this.getEnv(input.ambiente);
    const result = await this.cigamSyncService.syncProdutos(env);

    res.status(200).json({
      success: true,
      message: 'Sincronização de produtos finalizada.',
      data: result,
    });
  };

  syncClientes = async (req: Request, res: Response) => {
    const input = validateSync(req.body);
    const env = await this.getEnv(input.ambiente);
    const result = await this.cigamSyncService.syncClientes(env);

    res.status(200).json({
      success: true,
      message: 'Sincronização de clientes finalizada.',
      data: result,
    });
  };

  syncFormasPagamento = async (req: Request, res: Response) => {
    const input = validateSync(req.body);
    const env = await this.getEnv(input.ambiente);
    const result = await this.cigamSyncService.syncFormasPagamento(env);

    res.status(200).json({
      success: true,
      message: 'Sincronização de formas de pagamento finalizada.',
      data: result,
    });
  };

  syncTransportadoras = async (req: Request, res: Response) => {
    const input = validateSync(req.body);
    const env = await this.getEnv(input.ambiente);
    const result = await this.cigamSyncService.syncTransportadoras(env);

    res.status(200).json({
      success: true,
      message: 'Sincronização de transportadoras finalizada.',
      data: result,
    });
  };
}