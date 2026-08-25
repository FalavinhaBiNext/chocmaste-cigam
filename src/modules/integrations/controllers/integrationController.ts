import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { IntegrationHealthService } from '../services/integrationHealthService';
import { logger } from '@/shared/utils/logger';

@injectable()
export class IntegrationController {
  constructor(
    @inject(IntegrationHealthService) private readonly integrationHealthService: IntegrationHealthService,
  ) {}

  /**
   * Status consolidado de expiração de token de cada integração de marketplace.
   * GET /integrations/health
   */
  getHealth = async (_req: Request, res: Response) => {
    logger.route('Endpoint GET /integrations/health chamado');

    const data = await this.integrationHealthService.getHealth();

    res.status(200).json({
      success: true,
      message: 'Status das integrações obtido com sucesso.',
      data,
    });
  };
}
