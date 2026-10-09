import { inject, injectable } from 'tsyringe';
import { WebhookJobRepository } from '../repositories/webhookJobRepository';
import { WebhookJobModel, WebhookJobStatus } from '../models/webhookJobModel';
import { WebhookJobWorker, WEBHOOK_JOB_TIPO_BLING_PEDIDO } from './webhookJobWorker';
import { PedidoWebhookInput } from '@/modules/bling/blingWebhook.validator';
import { NotFoundError, ConflictError } from '@/shared/errors/AppError';
import { logger } from '@/shared/utils/logger';

@injectable()
export class WebhookJobService {
    constructor(
        @inject(WebhookJobRepository) private readonly webhookJobRepository: WebhookJobRepository,
        @inject(WebhookJobWorker) private readonly webhookJobWorker: WebhookJobWorker,
    ) {}

    /**
     * Enfileira o webhook de pedido do Bling para processamento em segundo
     * plano e avisa o worker. Retorna rápido, para o webhook responder na hora.
     */
    async enfileirarPedidoBling(input: PedidoWebhookInput): Promise<{ job: WebhookJobModel; created: boolean }> {
        const resultado = await this.webhookJobRepository.enqueue({
            event_id: input.eventId,
            tipo: WEBHOOK_JOB_TIPO_BLING_PEDIDO,
            pedido_id: input.data.id,
            payload: input,
        });

        if (resultado.created) {
            logger.webhook(`Webhook do pedido Bling #${input.data.id} enfileirado (job ${resultado.job.id}).`, { eventId: input.eventId });
            this.webhookJobWorker.notify();
        } else {
            logger.webhook(`Webhook duplicado ignorado: eventId ${input.eventId} já está na fila (job ${resultado.job.id}, status ${resultado.job.status}).`);
        }

        return resultado;
    }

    async listar(status?: WebhookJobStatus): Promise<WebhookJobModel[]> {
        return this.webhookJobRepository.findAll(status);
    }

    /** Recoloca um job na fila manualmente (ex.: depois de corrigir um De-Para). */
    async reprocessar(id: string): Promise<void> {
        const job = await this.webhookJobRepository.findById(id);
        if (!job) {
            throw new NotFoundError(`Job de webhook ${id} não encontrado.`);
        }
        const recolocado = await this.webhookJobRepository.requeue(id);
        if (!recolocado) {
            throw new ConflictError('Este job está sendo processado agora. Aguarde a conclusão.');
        }
        logger.info(`[WEBHOOK JOBS] Job ${id} recolocado na fila manualmente.`);
        this.webhookJobWorker.notify();
    }
}
