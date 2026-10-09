import { injectable } from 'tsyringe';
import { Op, UniqueConstraintError } from 'sequelize';
import { randomUUID } from 'crypto';
import { WebhookJobModel, WebhookJobStatus } from '../models/webhookJobModel';

export interface EnqueueWebhookJobInput {
    event_id: string;
    tipo: string;
    pedido_id?: number | null;
    payload: unknown;
}

@injectable()
export class WebhookJobRepository {
    /**
     * Grava o job na fila. Se já existir um job com o mesmo event_id (webhook
     * reenviado pela plataforma), devolve o existente com created=false.
     */
    async enqueue(data: EnqueueWebhookJobInput): Promise<{ job: WebhookJobModel; created: boolean }> {
        const existente = await WebhookJobModel.findOne({ where: { event_id: data.event_id } });
        if (existente) {
            return { job: existente, created: false };
        }

        try {
            const job = await WebhookJobModel.create({
                id: randomUUID(),
                event_id: data.event_id,
                tipo: data.tipo,
                pedido_id: data.pedido_id ?? null,
                payload: data.payload,
                status: 'pendente',
                tentativas: 0,
                proxima_execucao: new Date(),
            });
            return { job, created: true };
        } catch (error) {
            // Dois webhooks iguais chegando ao mesmo tempo: o segundo bate na
            // constraint unique de event_id e passa a ser tratado como duplicado.
            if (error instanceof UniqueConstraintError) {
                const job = await WebhookJobModel.findOne({ where: { event_id: data.event_id } });
                if (job) return { job, created: false };
            }
            throw error;
        }
    }

    /**
     * Reserva o próximo job pronto para execução (mais antigo primeiro),
     * marcando-o como "processando" e somando uma tentativa. O UPDATE é
     * condicionado ao status "pendente" para que o mesmo job nunca seja
     * reservado duas vezes.
     */
    async claimNext(agora: Date = new Date()): Promise<WebhookJobModel | null> {
        const candidato = await WebhookJobModel.findOne({
            where: { status: 'pendente', proxima_execucao: { [Op.lte]: agora } },
            order: [['proxima_execucao', 'ASC'], ['created_at', 'ASC']],
        });
        if (!candidato) return null;

        const [afetados] = await WebhookJobModel.update(
            {
                status: 'processando',
                tentativas: candidato.tentativas + 1,
                iniciado_em: agora,
            },
            { where: { id: candidato.id, status: 'pendente' } },
        );
        if (afetados === 0) return null;

        return WebhookJobModel.findByPk(candidato.id);
    }

    async markDone(id: string): Promise<void> {
        await WebhookJobModel.update(
            { status: 'concluido', finalizado_em: new Date(), ultimo_erro: null },
            { where: { id } },
        );
    }

    async markRetry(id: string, erro: string, proximaExecucao: Date): Promise<void> {
        await WebhookJobModel.update(
            { status: 'pendente', ultimo_erro: erro, proxima_execucao: proximaExecucao },
            { where: { id } },
        );
    }

    async markFailed(id: string, erro: string): Promise<void> {
        await WebhookJobModel.update(
            { status: 'falha', ultimo_erro: erro, finalizado_em: new Date() },
            { where: { id } },
        );
    }

    /**
     * Devolve à fila os jobs que ficaram em "processando" — acontece quando o
     * container reinicia (ex.: redeploy) no meio de um processamento.
     */
    async requeueStuck(): Promise<number> {
        const [afetados] = await WebhookJobModel.update(
            { status: 'pendente', proxima_execucao: new Date() },
            { where: { status: 'processando' } },
        );
        return afetados;
    }

    /** Recoloca um job (normalmente em falha) na fila com as tentativas zeradas. */
    async requeue(id: string): Promise<boolean> {
        const [afetados] = await WebhookJobModel.update(
            { status: 'pendente', tentativas: 0, proxima_execucao: new Date(), finalizado_em: null },
            { where: { id, status: { [Op.ne]: 'processando' } } },
        );
        return afetados > 0;
    }

    /** Remove jobs concluídos antigos para a tabela não crescer indefinidamente. */
    async purgeDoneBefore(data: Date): Promise<number> {
        return WebhookJobModel.destroy({
            where: { status: 'concluido', finalizado_em: { [Op.lt]: data } },
        });
    }

    async findAll(status?: WebhookJobStatus, limit = 100): Promise<WebhookJobModel[]> {
        return WebhookJobModel.findAll({
            where: status ? { status } : {},
            order: [['created_at', 'DESC']],
            limit,
        });
    }

    async findById(id: string): Promise<WebhookJobModel | null> {
        return WebhookJobModel.findByPk(id);
    }
}
