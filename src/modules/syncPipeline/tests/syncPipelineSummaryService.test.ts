import { describe, it, expect, vi } from 'vitest';
import { SyncPipelineSummaryService } from '../services/syncPipelineSummaryService';

describe('SyncPipelineSummaryService', () => {
  it('aggregates counts from events, pedidos and notas fiscais into a single summary', async () => {
    const eventRepository = {
      countBySyncStatus: vi.fn().mockResolvedValue({ pendente: 3, sincronizado: 10, falha: 2 }),
    };
    const pedidoRepository = {
      countByStatusNfe: vi.fn().mockResolvedValue({ pendente: 5, faturada: 6, enviada: 4 }),
    };
    const notasFiscaisCigamRepository = {
      countByEnviadoMarketplace: vi.fn().mockResolvedValue({ enviado: 7, pendente: 3 }),
    };

    const service = new SyncPipelineSummaryService(
      eventRepository as any,
      pedidoRepository as any,
      notasFiscaisCigamRepository as any,
    );

    const summary = await service.getSummary();

    expect(summary).toEqual({
      recebidos: 15,
      sincronizadosCigam: 10,
      sincronizacaoPendente: 3,
      sincronizacaoComFalha: 2,
      nfeFaturada: 10,
      nfeEnviadaMarketplace: 7,
    });
  });

  it('defaults missing sync_status buckets to zero', async () => {
    const eventRepository = { countBySyncStatus: vi.fn().mockResolvedValue({ sincronizado: 5 }) };
    const pedidoRepository = { countByStatusNfe: vi.fn().mockResolvedValue({}) };
    const notasFiscaisCigamRepository = { countByEnviadoMarketplace: vi.fn().mockResolvedValue({ enviado: 0, pendente: 0 }) };

    const service = new SyncPipelineSummaryService(
      eventRepository as any,
      pedidoRepository as any,
      notasFiscaisCigamRepository as any,
    );

    const summary = await service.getSummary();

    expect(summary.sincronizacaoPendente).toBe(0);
    expect(summary.sincronizacaoComFalha).toBe(0);
    expect(summary.nfeFaturada).toBe(0);
  });
});
