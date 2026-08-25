import { inject, injectable } from 'tsyringe';
import { EventRepository } from '@/modules/events/repositories/eventRepository';
import { PedidoRepository } from '@/modules/pedido/repositories/pedidoRepository';
import { NotasFiscaisCigamRepository } from '@/modules/notasFiscaisCigam/repositories/notasFiscaisCigamRepository';
import { logger } from '@/shared/utils/logger';
import { SyncPipelineSummaryDTO } from '../dto';

@injectable()
export class SyncPipelineSummaryService {
  constructor(
    @inject(EventRepository) private readonly eventRepository: EventRepository,
    @inject(PedidoRepository) private readonly pedidoRepository: PedidoRepository,
    @inject(NotasFiscaisCigamRepository) private readonly notasFiscaisCigamRepository: NotasFiscaisCigamRepository,
  ) {}

  /**
   * Agrega o funil pedido → sincronização CIGAM → NF-e faturada → NF-e enviada
   * ao marketplace via contagens no banco (sem carregar as linhas em memória).
   */
  async getSummary(): Promise<SyncPipelineSummaryDTO> {
    logger.info('Calculando resumo do funil operacional (sync-pipeline-summary)');

    const [eventCounts, statusNfeCounts, notaCounts] = await Promise.all([
      this.eventRepository.countBySyncStatus(),
      this.pedidoRepository.countByStatusNfe(),
      this.notasFiscaisCigamRepository.countByEnviadoMarketplace(),
    ]);

    const recebidos = Object.values(eventCounts).reduce((acc, n) => acc + n, 0);
    const sincronizadosCigam = eventCounts['sincronizado'] ?? 0;
    const sincronizacaoPendente = eventCounts['pendente'] ?? 0;
    const sincronizacaoComFalha = eventCounts['falha'] ?? 0;

    const nfeFaturada = Object.entries(statusNfeCounts)
      .filter(([status]) => status !== 'pendente')
      .reduce((acc, [, count]) => acc + count, 0);

    const summary: SyncPipelineSummaryDTO = {
      recebidos,
      sincronizadosCigam,
      sincronizacaoPendente,
      sincronizacaoComFalha,
      nfeFaturada,
      nfeEnviadaMarketplace: notaCounts.enviado,
    };

    logger.success('Resumo do funil operacional calculado', summary as any);
    return summary;
  }
}
