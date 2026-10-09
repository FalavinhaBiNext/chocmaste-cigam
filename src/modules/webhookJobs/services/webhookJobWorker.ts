import { inject, injectable } from 'tsyringe';
import { WebhookJobRepository } from '../repositories/webhookJobRepository';
import { WebhookJobModel } from '../models/webhookJobModel';
import { WebhookService } from '@/modules/bling/services/webhookService';
import { PedidoWebhookInput } from '@/modules/bling/blingWebhook.validator';
import { logger } from '@/shared/utils/logger';

export const WEBHOOK_JOB_TIPO_BLING_PEDIDO = 'bling.pedido';

// Total de tentativas por job (a 1ª + as novas tentativas automáticas).
export const WEBHOOK_JOB_MAX_TENTATIVAS = 5;
// Espera antes de cada nova tentativa: 1 min, 5 min, 15 min, 60 min.
const ESPERAS_RETENTATIVA_MS = [1, 5, 15, 60].map((min) => min * 60_000);
// Intervalo em que o worker verifica jobs prontos (inclui os agendados para retentativa).
const INTERVALO_VERIFICACAO_MS = 5_000;
// Jobs concluídos ficam guardados por 30 dias, para consulta.
const RETENCAO_CONCLUIDOS_MS = 30 * 24 * 60 * 60_000;
const INTERVALO_LIMPEZA_MS = 24 * 60 * 60_000;

/**
 * Worker da fila de webhooks. Roda dentro da própria API e processa UM job
 * por vez — assim pedidos que chegam juntos não disputam as APIs do Bling e
 * do CIGAM, e o mesmo pedido nunca é processado em paralelo.
 */
@injectable()
export class WebhookJobWorker {
    private intervalo: NodeJS.Timeout | null = null;
    private intervaloLimpeza: NodeJS.Timeout | null = null;
    private processando = false;
    private ativo = false;

    constructor(
        @inject(WebhookJobRepository) private readonly webhookJobRepository: WebhookJobRepository,
        @inject(WebhookService) private readonly webhookService: WebhookService,
    ) {}

    async start(): Promise<void> {
        if (this.ativo) return;
        this.ativo = true;

        const devolvidos = await this.webhookJobRepository.requeueStuck();
        if (devolvidos > 0) {
            logger.warn(`[WEBHOOK JOBS] ${devolvidos} job(s) interrompido(s) por reinício devolvido(s) à fila.`);
        }

        this.intervalo = setInterval(() => this.notify(), INTERVALO_VERIFICACAO_MS);
        this.intervaloLimpeza = setInterval(() => this.limparConcluidos(), INTERVALO_LIMPEZA_MS);
        this.intervalo.unref();
        this.intervaloLimpeza.unref();

        logger.info('[WEBHOOK JOBS] Worker da fila de webhooks iniciado.');
        this.notify();
        void this.limparConcluidos();
    }

    stop(): void {
        this.ativo = false;
        if (this.intervalo) clearInterval(this.intervalo);
        if (this.intervaloLimpeza) clearInterval(this.intervaloLimpeza);
        this.intervalo = null;
        this.intervaloLimpeza = null;
    }

    /** Pede ao worker para verificar a fila agora (ex.: logo após enfileirar um job). */
    notify(): void {
        if (!this.ativo) return;
        void this.drenarFila();
    }

    /**
     * Processa os jobs prontos, um após o outro, até a fila esvaziar. Se já
     * houver uma drenagem em andamento, não inicia outra.
     */
    async drenarFila(): Promise<void> {
        if (this.processando) return;
        this.processando = true;

        try {
            let job = await this.webhookJobRepository.claimNext();
            while (job) {
                await this.processar(job);
                job = this.ativo ? await this.webhookJobRepository.claimNext() : null;
            }
        } catch (error: any) {
            logger.error(`[WEBHOOK JOBS] Erro ao consultar a fila: ${error.message}`);
        } finally {
            this.processando = false;
        }
    }

    async processar(job: WebhookJobModel): Promise<void> {
        logger.info(`[WEBHOOK JOBS] Processando job ${job.id} (${job.tipo}, pedido ${job.pedido_id ?? '-'}) — tentativa ${job.tentativas}/${WEBHOOK_JOB_MAX_TENTATIVAS}`);

        try {
            await this.executar(job);
            await this.webhookJobRepository.markDone(job.id);
            logger.success(`[WEBHOOK JOBS] Job ${job.id} concluído.`);
        } catch (error: any) {
            const mensagem = error?.message || String(error);

            if (job.tentativas >= WEBHOOK_JOB_MAX_TENTATIVAS) {
                await this.webhookJobRepository.markFailed(job.id, mensagem);
                logger.error(`[WEBHOOK JOBS] Job ${job.id} falhou definitivamente após ${job.tentativas} tentativa(s): ${mensagem}`);
                return;
            }

            const espera = ESPERAS_RETENTATIVA_MS[Math.min(job.tentativas - 1, ESPERAS_RETENTATIVA_MS.length - 1)];
            await this.webhookJobRepository.markRetry(job.id, mensagem, new Date(Date.now() + espera));
            logger.warn(`[WEBHOOK JOBS] Job ${job.id} falhou (tentativa ${job.tentativas}): ${mensagem}. Nova tentativa em ${espera / 60_000} min.`);
        }
    }

    private async executar(job: WebhookJobModel): Promise<void> {
        const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;

        switch (job.tipo) {
            case WEBHOOK_JOB_TIPO_BLING_PEDIDO:
                await this.webhookService.processarPedidoCriado(payload as PedidoWebhookInput);
                return;
            default:
                throw new Error(`Tipo de job de webhook desconhecido: ${job.tipo}`);
        }
    }

    private async limparConcluidos(): Promise<void> {
        try {
            const removidos = await this.webhookJobRepository.purgeDoneBefore(new Date(Date.now() - RETENCAO_CONCLUIDOS_MS));
            if (removidos > 0) {
                logger.info(`[WEBHOOK JOBS] ${removidos} job(s) concluído(s) antigo(s) removido(s).`);
            }
        } catch (error: any) {
            logger.warn(`[WEBHOOK JOBS] Falha ao limpar jobs concluídos: ${error.message}`);
        }
    }
}
