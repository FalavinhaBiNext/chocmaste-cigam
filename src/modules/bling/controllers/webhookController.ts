import { injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { WebhookService } from '../services/webhookService';
import { validatePedidoWebhook } from '../blingWebhook.validator';
import { logger } from '@/shared/utils/logger';

@injectable()
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService
  ) {}

  handlePedidoCriado = async (req: Request, res: Response): Promise<void> => {
    logger.webhook('Webhook de pedido recebido', { body: req.body });

    const input = validatePedidoWebhook(req.body);

    const cigamPedidoId = await this.webhookService.processarPedidoCriado(input);

    res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso.',
      data: {
        codigoPedidoCigam: cigamPedidoId
      }
    });
  }
}
