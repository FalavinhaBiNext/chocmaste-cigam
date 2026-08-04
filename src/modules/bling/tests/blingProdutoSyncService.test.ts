import { describe, it, expect, vi } from 'vitest';
import { BlingProdutoSyncService } from '../services/blingProdutoSyncService';

function makeService(mocks: any = {}) {
  const blingProdutosService = {
    getById: vi.fn(),
    listAll: vi.fn(),
    listAllWithDetails: vi.fn(),
    ...mocks.blingProdutosService,
  };

  const produtoRepository = {
    findByIdBling: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'local-uuid-1', ...data })),
    update: vi.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
    ...mocks.produtoRepository,
  };

  return {
    service: new BlingProdutoSyncService(
      blingProdutosService as any,
      produtoRepository as any,
    ),
    mocks: { blingProdutosService, produtoRepository },
  };
}

const blingProdutoResponse = {
  data: {
    id: 16566745325,
    nome: 'Aquecedor de Papinha com Controle Digital 4 em 1',
    codigo: '3343',
    preco: 0,
    tipo: 'P',
    situacao: 'A',
    formato: 'V',
    descricaoCurta: '<h2>Produto teste</h2>',
    unidade: 'UNIDAD',
    tipoProducao: 'T',
    condicao: 1,
    marca: 'CHOCMASTER',
    categoria: { id: 7013636 },
    fornecedor: {
      id: 740980041,
      contato: { id: 16461322303, nome: 'IMPORTADO' },
      codigo: '',
      precoCusto: 123.9,
    },
    tributacao: { ncm: '8516.29.00' },
    variacoes: [
      { id: 16566751166, nome: 'voltagem:110v' },
      { id: 16566751168, nome: 'voltagem:220v' },
    ],
  },
};

describe('BlingProdutoSyncService', () => {
  describe('salvarProduto', () => {
    it('should fetch from Bling API and create new product locally', async () => {
      const { service, mocks } = makeService({
        blingProdutosService: {
          getById: vi.fn().mockResolvedValue(blingProdutoResponse),
        },
      });

      const result = await service.salvarProduto('16566745325');

      expect(mocks.blingProdutosService.getById).toHaveBeenCalledWith('16566745325');
      expect(mocks.produtoRepository.findByIdBling).toHaveBeenCalledWith('16566745325');
      expect(mocks.produtoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id_bling: '16566745325',
          nome: 'Aquecedor de Papinha com Controle Digital 4 em 1',
          codigo: '3343',
          tipo: 'P',
          situacao: 'A',
          formato: 'V',
          unidade: 'UNIDAD',
          tipoProduto: 'T',
          condicao: 1,
          marca: 'CHOCMASTER',
          categoria_id: 7013636,
          fornecedor_id: 740980041,
          fornecedor_nome: 'IMPORTADO',
          fornecedor_precoCusto: 123.9,
          ncm: '8516.29.00',
          temVariacoes: true,
          ativo: true,
        }),
      );
      expect(result.id).toBe('local-uuid-1');
    });

    it('should update existing product when already mapped', async () => {
      const { service, mocks } = makeService({
        blingProdutosService: {
          getById: vi.fn().mockResolvedValue(blingProdutoResponse),
        },
        produtoRepository: {
          findByIdBling: vi.fn().mockResolvedValue({ id: 'existing-uuid', nome: 'Produto Antigo' }),
          update: vi.fn().mockResolvedValue({ id: 'existing-uuid', nome: 'Aquecedor de Papinha...' }),
        },
      });

      const result = await service.salvarProduto('16566745325');

      expect(mocks.produtoRepository.update).toHaveBeenCalledWith(
        'existing-uuid',
        expect.objectContaining({
          nome: 'Aquecedor de Papinha com Controle Digital 4 em 1',
        }),
      );
      expect(mocks.produtoRepository.create).not.toHaveBeenCalled();
      expect(result.id).toBe('existing-uuid');
    });

    it('should handle product without variations', async () => {
      const { service, mocks } = makeService({
        blingProdutosService: {
          getById: vi.fn().mockResolvedValue({
            data: {
              id: 123456,
              nome: 'Produto Sem Variacao',
              codigo: '001',
              preco: 50.0,
              situacao: 'A',
              variacoes: [],
            },
          }),
        },
      });

      await service.salvarProduto('123456');

      expect(mocks.produtoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temVariacoes: false,
          ativo: true,
          preco: 50.0,
        }),
      );
    });

    it('should set ativo=false when situacao is not A', async () => {
      const { service, mocks } = makeService({
        blingProdutosService: {
          getById: vi.fn().mockResolvedValue({
            data: {
              id: 789,
              nome: 'Produto Inativo',
              situacao: 'I',
            },
          }),
        },
      });

      await service.salvarProduto('789');

      expect(mocks.produtoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: false }),
      );
    });

    it('should throw when Bling API fails', async () => {
      const { service } = makeService({
        blingProdutosService: {
          getById: vi.fn().mockRejectedValue(new Error('Bling API timeout')),
        },
      });

      await expect(service.salvarProduto('999')).rejects.toThrow('Bling API timeout');
    });
  });

  describe('salvarProdutos', () => {
    it('should save multiple products and return summary', async () => {
      const { service, mocks } = makeService({
        blingProdutosService: {
          getById: vi.fn()
            .mockResolvedValueOnce({
              data: { id: 111, nome: 'Produto 1', situacao: 'A' },
            })
            .mockResolvedValueOnce({
              data: { id: 222, nome: 'Produto 2', situacao: 'A' },
            }),
        },
      });

      const result = await service.salvarProdutos(['111', '222']);

      expect(result.criados).toBe(2);
      expect(result.atualizados).toBe(0);
      expect(result.erros).toHaveLength(0);
    });

    it('should handle errors gracefully for individual products', async () => {
      const { service } = makeService({
        blingProdutosService: {
          getById: vi.fn()
            .mockResolvedValueOnce({
              data: { id: 111, nome: 'Produto 1', situacao: 'A' },
            })
            .mockRejectedValueOnce(new Error('Product not found')),
        },
      });

      const result = await service.salvarProdutos(['111', '999']);

      expect(result.criados).toBe(1);
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0]).toContain('999');
    });
  });

  describe('sincronizarTodos', () => {
    it('should fetch all products from Bling and sync locally', async () => {
      const { service, mocks } = makeService({
        blingProdutosService: {
          listAllWithDetails: vi.fn().mockResolvedValue([
            { id: 111, nome: 'Produto 1', situacao: 'A' },
            { id: 222, nome: 'Produto 2', situacao: 'I' },
          ]),
        },
      });

      const result = await service.sincronizarTodos();

      expect(mocks.blingProdutosService.listAllWithDetails).toHaveBeenCalled();
      expect(result.criados).toBe(2);
      expect(result.erros).toHaveLength(0);
    });

    it('should update existing products', async () => {
      const { service, mocks } = makeService({
        blingProdutosService: {
          listAllWithDetails: vi.fn().mockResolvedValue([
            { id: 111, nome: 'Produto Atualizado', situacao: 'A' },
          ]),
        },
        produtoRepository: {
          findByIdBling: vi.fn().mockResolvedValue({ id: 'existing-uuid' }),
          update: vi.fn().mockResolvedValue({ id: 'existing-uuid' }),
        },
      });

      const result = await service.sincronizarTodos();

      expect(result.atualizados).toBe(1);
      expect(result.criados).toBe(0);
      expect(mocks.produtoRepository.update).toHaveBeenCalled();
    });

    it('should return empty result when no products in Bling', async () => {
      const { service } = makeService({
        blingProdutosService: {
          listAllWithDetails: vi.fn().mockResolvedValue([]),
        },
      });

      const result = await service.sincronizarTodos();

      expect(result.criados).toBe(0);
      expect(result.atualizados).toBe(0);
      expect(result.erros).toHaveLength(0);
    });
  });

  describe('mapearParaProduto', () => {
    it('should map all Bling fields correctly', async () => {
      const { service, mocks } = makeService({
        blingProdutosService: {
          getById: vi.fn().mockResolvedValue(blingProdutoResponse),
        },
      });

      await service.salvarProduto('16566745325');

      const createCall = mocks.produtoRepository.create.mock.calls[0][0];
      expect(createCall.nome).toBe('Aquecedor de Papinha com Controle Digital 4 em 1');
      expect(createCall.codigo).toBe('3343');
      expect(createCall.preco).toBe(0);
      expect(createCall.tipo).toBe('P');
      expect(createCall.situacao).toBe('A');
      expect(createCall.formato).toBe('V');
      expect(createCall.descricaoCurta).toBe('<h2>Produto teste</h2>');
      expect(createCall.unidade).toBe('UNIDAD');
      expect(createCall.tipoProduto).toBe('T');
      expect(createCall.condicao).toBe(1);
      expect(createCall.marca).toBe('CHOCMASTER');
      expect(createCall.categoria_id).toBe(7013636);
      expect(createCall.fornecedor_id).toBe(740980041);
      expect(createCall.fornecedor_nome).toBe('IMPORTADO');
      expect(createCall.fornecedor_precoCusto).toBe(123.9);
      expect(createCall.ncm).toBe('8516.29.00');
      expect(createCall.temVariacoes).toBe(true);
    });
  });
});
