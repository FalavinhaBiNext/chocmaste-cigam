import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { validatePedidoWebhook } from '../blingWebhook.validator';
import { WebhookJobService } from '@/modules/webhookJobs/services/webhookJobService';
import { logger } from '@/shared/utils/logger';

@injectable()
export class WebhookController {
  constructor(
    @inject(WebhookJobService) private readonly webhookJobService: WebhookJobService
  ) {}

  /**
   * Só valida, enfileira e responde. O processamento (Bling + CIGAM) pode
   * levar mais de um minuto, então roda em segundo plano no WebhookJobWorker —
   * assim o Bling recebe a resposta na hora e não desativa o webhook por timeout.
   */
  handlePedidoCriado = async (req: Request, res: Response): Promise<void> => {
    logger.webhook('Webhook de pedido recebido', { body: req.body });

    const input = validatePedidoWebhook(req.body);

    const { job, created } = await this.webhookJobService.enfileirarPedidoBling(input);

    res.status(200).json({
      success: true,
      message: created
        ? 'Webhook recebido e enfileirado para processamento.'
        : 'Webhook já recebido anteriormente.',
      data: {
        jobId: job.id,
        status: job.status
      }
    });
  }
}
