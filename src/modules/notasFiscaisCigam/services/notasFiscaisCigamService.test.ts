import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/utils/pdfUtils', () => ({
  mergePdfBuffers: vi.fn().mockResolvedValue(Buffer.from('merged-pdf-content')),
  extractPdfFromZip: vi.fn(),
}));

import { NotasFiscaisCigamService } from './notasFiscaisCigamService';

describe('NotasFiscaisCigamService.buscarEtiquetaCombinada', () => {
  let service: NotasFiscaisCigamService;
  let mockRepo: any;
  let mockMercadoLivreLabel: any;
  let mockShopeeLabel: any;
  let mockTrayLabel: any;

  const notaBase = {
    id: 'nota-1',
    numero_pedido_cigam: '000303',
    numero_pedido_marketplace: 'AMZ123',
    marketplace: 'amazon',
  };

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn().mockResolvedValue(notaBase),
      findEtiquetaPdf: vi.fn().mockResolvedValue(null),
    };
    mockMercadoLivreLabel = { obterEtiquetaPorPedidoCigam: vi.fn() };
    mockShopeeLabel = { obterEtiqueta: vi.fn() };
    mockTrayLabel = { obterEtiquetaPdf: vi.fn() };

    service = new NotasFiscaisCigamService(
      mockRepo,
      {} as any, // pedidoService
      {} as any, // mercadoLivreFiscalService
      mockMercadoLivreLabel,
      {} as any, // shopeeFiscalService
      mockShopeeLabel,
      {} as any, // trayFiscalService
      mockTrayLabel,
      {} as any, // blingService
      {} as any, // cigamNfeRoutingService
    );
  });

  it('modo=cigam: retorna o PDF do ERP quando existir, sem consultar o marketplace', async () => {
    mockRepo.findEtiquetaPdf.mockResolvedValue(Buffer.from('erp-pdf-content').toString('base64'));

    const resultado = await service.buscarEtiquetaCombinada('nota-1', 'cigam');

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.buffer.toString()).toBe('erp-pdf-content');
      expect(resultado.filename).toBe('etiqueta-cigam-000303.pdf');
    }
    expect(mockTrayLabel.obterEtiquetaPdf).not.toHaveBeenCalled();
  });

  it('modo=cigam: retorna erro quando não há PDF do ERP salvo', async () => {
    const resultado = await service.buscarEtiquetaCombinada('nota-1', 'cigam');

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.message).toContain('não tem um PDF de etiqueta enviado pelo CIGAM');
    }
  });

  it('modo=marketplace: retorna só a etiqueta do marketplace, mesmo havendo PDF do ERP', async () => {
    mockRepo.findEtiquetaPdf.mockResolvedValue(Buffer.from('erp-pdf-content').toString('base64'));
    mockTrayLabel.obterEtiquetaPdf.mockResolvedValue(Buffer.from('tray-label-content'));

    const resultado = await service.buscarEtiquetaCombinada('nota-1', 'marketplace');

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.buffer.toString()).toBe('tray-label-content');
      expect(resultado.filename).toBe('etiqueta-marketplace-000303.pdf');
    }
  });

  it('modo=marketplace: retorna erro quando a busca no marketplace falhar', async () => {
    mockTrayLabel.obterEtiquetaPdf.mockRejectedValue(new Error('Etiqueta ainda não liberada.'));

    const resultado = await service.buscarEtiquetaCombinada('nota-1', 'marketplace');

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.message).toBe('Etiqueta ainda não liberada.');
    }
  });

  it('modo=ambos (padrão): junta marketplace + PDF do ERP quando ambos existirem', async () => {
    mockRepo.findEtiquetaPdf.mockResolvedValue(Buffer.from('%PDF-erp').toString('base64'));
    mockTrayLabel.obterEtiquetaPdf.mockResolvedValue(Buffer.from('%PDF-tray'));

    const resultado = await service.buscarEtiquetaCombinada('nota-1');

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.filename).toBe('etiqueta-combinada-000303.pdf');
    }
  });
});
