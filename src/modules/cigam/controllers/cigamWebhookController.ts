import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { CigamWebhookService } from '../services/cigamWebhookService';
import { validateCigamProdutoWebhook } from '../cigamWebhook.validator';
import { logger } from '@/shared/utils/logger';

@injectable()
export class CigamWebhookController {
  constructor(
    @inject(CigamWebhookService) private readonly cigamWebhookService: CigamWebhookService
  ) {}

  handleProdutoCriado = async (req: Request, res: Response): Promise<void> => {
    logger.webhook('Webhook CIGAM de produto recebido', { body: req.body });

    const input = validateCigamProdutoWebhook(req.body);

    const result = await this.cigamWebhookService.processarProdutoCriado(input);

    res.status(201).json({
      success: true,
      message: 'Produto processado com sucesso no fluxo reverso.',
      data: result
    });
  }
}
