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

describe('NotasFiscaisCigamService.enviarParaMarketplace — Shopee', () => {
  const notaShopee = {
    id: 'nota-sp',
    numero_pedido_cigam: '000500',
    numero_pedido_marketplace: '2510ABCDEF',
    marketplace: 'shopee',
    enviado_marketplace: false,
    xml_content: '<xml/>',
    chave_acesso: '35260912345678000100550010000829571234567890',
    created_at: new Date('2026-10-01T10:00:00Z'),
  };

  const criarServico = (organizarEnvio: any) => {
    const repo = {
      findById: vi.fn().mockResolvedValue({ ...notaShopee }),
      updateEnviadoMarketplace: vi.fn().mockResolvedValue(undefined),
    };
    const shopeeFiscal = { enviarNFe: vi.fn().mockResolvedValue({ success: true }) };
    const shopeeLabel = { obterEtiqueta: vi.fn(), organizarEnvio };
    const routing = {
      obterUnidadeLocal: vi.fn().mockReturnValue('UN-01'),
      identificarUnidadeNegocio: vi.fn().mockReturnValue({ unidade: 'UN-01' }),
      isUnidadeLocal: vi.fn().mockReturnValue(true),
    };
    const pedidoService = { findByNumeroPedidoCigam: vi.fn().mockResolvedValue(null) };
    const service = new NotasFiscaisCigamService(
      repo as any,
      pedidoService as any,
      {} as any,
      {} as any,
      shopeeFiscal as any,
      shopeeLabel as any,
      {} as any,
      {} as any,
      {} as any,
      routing as any,
    );
    return { service, repo, shopeeFiscal };
  };

  it('organiza o envio (ship_order) logo após a NF-e ser aceita', async () => {
    const organizarEnvio = vi.fn().mockResolvedValue({ success: true });
    const { service, repo, shopeeFiscal } = criarServico(organizarEnvio);

    const resultado = await service.enviarParaMarketplace('nota-sp');

    expect(shopeeFiscal.enviarNFe).toHaveBeenCalledWith('2510ABCDEF', expect.any(Object));
    expect(repo.updateEnviadoMarketplace).toHaveBeenCalledWith('nota-sp', true);
    expect(organizarEnvio).toHaveBeenCalledWith('2510ABCDEF');
    expect(resultado.success).toBe(true);
    expect(resultado.message).toContain('envio organizado na Shopee');
  });

  it('mantém a NF-e como enviada mesmo se a organização do envio falhar', async () => {
    const organizarEnvio = vi.fn().mockResolvedValue({ success: false, error: 'SHOPEE_SENDER_NAME não configurado' });
    const { service, repo } = criarServico(organizarEnvio);

    const resultado = await service.enviarParaMarketplace('nota-sp');

    expect(repo.updateEnviadoMarketplace).toHaveBeenCalledWith('nota-sp', true);
    expect(resultado.success).toBe(true);
    expect(resultado.message).toContain('não foi possível organizar o envio agora');
  });
});

describe('NotasFiscaisCigamService.verificarOrganizacaoEnvioShopee', () => {
  it('verifica as NF-es Shopee enviadas e devolve resumo + itens com a nota de cada pedido', async () => {
    const repo = {
      findShopeeEnviadasDesde: vi.fn().mockResolvedValue([
        { id: 'n1', numero_pedido_cigam: '000501', numero_pedido_marketplace: 'SP1' },
        { id: 'n2', numero_pedido_cigam: '000502', numero_pedido_marketplace: 'SP2' },
      ]),
    };
    const shopeeLabel = {
      verificarEOrganizarEnvios: vi.fn().mockResolvedValue([
        { orderSn: 'SP1', status: 'READY_TO_SHIP', situacao: 'organizado_agora' },
        { orderSn: 'SP2', status: 'PROCESSED', situacao: 'ja_organizado' },
      ]),
    };
    const service = new NotasFiscaisCigamService(
      repo as any, {} as any, {} as any, {} as any, {} as any, shopeeLabel as any, {} as any, {} as any, {} as any, {} as any,
    );

    const { resumo, itens } = await service.verificarOrganizacaoEnvioShopee(15);

    const desde: Date = repo.findShopeeEnviadasDesde.mock.calls[0][0];
    expect(Date.now() - desde.getTime()).toBeGreaterThanOrEqual(15 * 24 * 60 * 60 * 1000 - 1000);
    expect(shopeeLabel.verificarEOrganizarEnvios).toHaveBeenCalledWith(['SP1', 'SP2']);
    expect(resumo).toEqual({ verificados: 2, jaOrganizados: 1, organizadosAgora: 1, falhas: 0, ignorados: 0, naoEncontrados: 0 });
    expect(itens[0]).toEqual(expect.objectContaining({ orderSn: 'SP1', notaId: 'n1', numeroPedidoCigam: '000501' }));
  });
});
