import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { SyncPipelineSummaryService } from '../services/syncPipelineSummaryService';
import { logger } from '@/shared/utils/logger';

@injectable()
export class SyncPipelineController {
  constructor(
    @inject(SyncPipelineSummaryService) private readonly syncPipelineSummaryService: SyncPipelineSummaryService,
  ) {}

  /**
   * Resumo agregado do funil pedido → CIGAM → NF-e → marketplace.
   * GET /sync-pipeline-summary
   */
  getSummary = async (_req: Request, res: Response) => {
    logger.route('Endpoint GET /sync-pipeline-summary chamado');

    const data = await this.syncPipelineSummaryService.getSummary();

    res.status(200).json({
      success: true,
      message: 'Resumo do funil operacional obtido com sucesso.',
      data,
    });
  };
}
