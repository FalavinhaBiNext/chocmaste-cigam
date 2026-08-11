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

    if (this.cigamSyncService.hasRunningJob('all')) {
      const existingJobId = this.cigamSyncService.getRunningJobId('all');
      res.status(200).json({
        success: true,
        message: 'Sincronização completa já em andamento.',
        data: { jobId: existingJobId, status: 'running' },
      });
      return;
    }

    const jobId = this.cigamSyncService.startSyncInBackground(
      'all',
      () => this.cigamSyncService.syncAll(env),
    );

    res.status(202).json({
      success: true,
      message: 'Sincronização completa iniciada em background.',
      data: { jobId, status: 'running' },
    });
  };

  syncStatus = async (req: Request, res: Response) => {
    const jobId = String(req.params.jobId);
    const job = this.cigamSyncService.getJobStatus(jobId);

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job de sincronização não encontrado.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  };

  syncProdutos = async (req: Request, res: Response) => {
    const input = validateSync(req.body);
    const env = await this.getEnv(input.ambiente);

    if (this.cigamSyncService.hasRunningJob('produtos')) {
      const existingJobId = this.cigamSyncService.getRunningJobId('produtos');
      res.status(200).json({
        success: true,
        message: 'Sincronização de produtos já em andamento.',
        data: { jobId: existingJobId, status: 'running' },
      });
      return;
    }

    const jobId = this.cigamSyncService.startSyncInBackground(
      'produtos',
      () => this.cigamSyncService.syncProdutos(env),
    );

    res.status(202).json({
      success: true,
      message: 'Sincronização de produtos iniciada em background.',
      data: { jobId, status: 'running' },
    });
  };

  syncClientes = async (req: Request, res: Response) => {
    const input = validateSync(req.body);
    const env = await this.getEnv(input.ambiente);

    if (this.cigamSyncService.hasRunningJob('clientes')) {
      const existingJobId = this.cigamSyncService.getRunningJobId('clientes');
      res.status(200).json({
        success: true,
        message: 'Sincronização de clientes já em andamento.',
        data: { jobId: existingJobId, status: 'running' },
      });
      return;
    }

    const jobId = this.cigamSyncService.startSyncInBackground(
      'clientes',
      () => this.cigamSyncService.syncClientes(env),
    );

    res.status(202).json({
      success: true,
      message: 'Sincronização de clientes iniciada em background.',
      data: { jobId, status: 'running' },
    });
  };

  syncFormasPagamento = async (req: Request, res: Response) => {
    const input = validateSync(req.body);
    const env = await this.getEnv(input.ambiente);

    if (this.cigamSyncService.hasRunningJob('formas_pagamento')) {
      const existingJobId = this.cigamSyncService.getRunningJobId('formas_pagamento');
      res.status(200).json({
        success: true,
        message: 'Sincronização de formas de pagamento já em andamento.',
        data: { jobId: existingJobId, status: 'running' },
      });
      return;
    }

    const jobId = this.cigamSyncService.startSyncInBackground(
      'formas_pagamento',
      () => this.cigamSyncService.syncFormasPagamento(env),
    );

    res.status(202).json({
      success: true,
      message: 'Sincronização de formas de pagamento iniciada em background.',
      data: { jobId, status: 'running' },
    });
  };

  syncTransportadoras = async (req: Request, res: Response) => {
    const input = validateSync(req.body);
    const env = await this.getEnv(input.ambiente);

    if (this.cigamSyncService.hasRunningJob('transportadoras')) {
      const existingJobId = this.cigamSyncService.getRunningJobId('transportadoras');
      res.status(200).json({
        success: true,
        message: 'Sincronização de transportadoras já em andamento.',
        data: { jobId: existingJobId, status: 'running' },
      });
      return;
    }

    const jobId = this.cigamSyncService.startSyncInBackground(
      'transportadoras',
      () => this.cigamSyncService.syncTransportadoras(env),
    );

    res.status(202).json({
      success: true,
      message: 'Sincronização de transportadoras iniciada em background.',
      data: { jobId, status: 'running' },
    });
  };
}