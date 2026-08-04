import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CigamMateriaisIntegradorService } from '../services/cigamMateriaisIntegradorService';

function makeService(mocks: any = {}) {
  const integradorClient = {
    post: vi.fn().mockResolvedValue({ sucesso: true }),
    get: vi.fn().mockResolvedValue([]),
    ...mocks.integradorClient,
  };

  const usuarioCigamService = {
    findAll: vi.fn().mockResolvedValue([{ ambiente: 'producao', ativo: true }]),
    ...mocks.usuarioCigamService,
  };

  const produtoRepository = {
    create: vi.fn().mockResolvedValue({ id: 'local-uuid-1', nome: 'Teste' }),
    findAll: vi.fn().mockResolvedValue([]),
    ...mocks.produtoRepository,
  };

  const deParaProdutosRepository = {
    findByIdBling: vi.fn().mockResolvedValue(null),
    findByIdCigam: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: 'depara-uuid-1' }),
    ...mocks.deParaProdutosRepository,
  };

  return {
    service: new CigamMateriaisIntegradorService(
      integradorClient as any,
      usuarioCigamService as any,
      produtoRepository as any,
      deParaProdutosRepository as any,
    ),
    mocks: { integradorClient, usuarioCigamService, produtoRepository, deParaProdutosRepository },
  };
}

const baseInput = {
  codigoGrupo: '001',
  codigoSubGrupo: '01',
  codigoMaterial: 'MAT001',
  descricao: 'Chocolate ao Leite',
  tipo: 'A',
  codigoUnidadeMedida: 'UN',
  utilizaGrade: 'N',
};

describe('CigamMateriaisIntegradorService', () => {
  describe('cadastrarEmapear', () => {
    it('should cadastrar material and create De-Para mapping', async () => {
      const { service, mocks } = makeService();

      await service.cadastrarEmapear({
        ...baseInput,
        idProdutoLocal: 'bling-id-123',
        nomeProduto: 'Chocolate ao Leite',
      });

      expect(mocks.integradorClient.post).toHaveBeenCalledWith(
        '/Cadastrar',
        expect.objectContaining({
          codigoMaterial: 'MAT001',
          descricao: 'Chocolate ao Leite',
          statusRegistro: 'L',
        }),
        'producao',
      );

      expect(mocks.deParaProdutosRepository.findByIdBling).toHaveBeenCalledWith('bling-id-123');
      expect(mocks.deParaProdutosRepository.create).toHaveBeenCalledWith({
        id_bling: 'bling-id-123',
        id_cigam: 'MAT001',
        nome: 'Chocolate ao Leite',
      });
    });

    it('should cadastrar material without De-Para when idProdutoLocal is not provided', async () => {
      const { service, mocks } = makeService();

      await service.cadastrarEmapear({
        ...baseInput,
        nomeProduto: 'Chocolate ao Leite',
      });

      expect(mocks.integradorClient.post).toHaveBeenCalled();
      expect(mocks.deParaProdutosRepository.findByIdBling).not.toHaveBeenCalled();
      expect(mocks.deParaProdutosRepository.create).not.toHaveBeenCalled();
    });

    it('should skip De-Para creation when mapping already exists', async () => {
      const { service, mocks } = makeService({
        deParaProdutosRepository: {
          findByIdBling: vi.fn().mockResolvedValue({ id: 'existing', id_bling: 'bling-id-123', id_cigam: 'MAT001' }),
        },
      });

      await service.cadastrarEmapear({
        ...baseInput,
        idProdutoLocal: 'bling-id-123',
        nomeProduto: 'Chocolate ao Leite',
      });

      expect(mocks.integradorClient.post).toHaveBeenCalled();
      expect(mocks.deParaProdutosRepository.findByIdBling).toHaveBeenCalledWith('bling-id-123');
      expect(mocks.deParaProdutosRepository.create).not.toHaveBeenCalled();
    });

    it('should throw when Integrador returns sucesso=false', async () => {
      const { service, mocks } = makeService({
        integradorClient: {
          post: vi.fn().mockResolvedValue({ sucesso: false, mensagem: 'Material duplicado' }),
        },
      });

      await expect(
        service.cadastrarEmapear({
          ...baseInput,
          idProdutoLocal: 'bling-id-123',
          nomeProduto: 'Chocolate ao Leite',
        }),
      ).rejects.toThrow('Falha ao cadastrar material no CIGAM: Material duplicado');
    });

    it('should throw when Integrador post fails', async () => {
      const { service } = makeService({
        integradorClient: {
          post: vi.fn().mockRejectedValue(new Error('Connection refused')),
        },
      });

      await expect(
        service.cadastrarEmapear({
          ...baseInput,
          idProdutoLocal: 'bling-id-123',
          nomeProduto: 'Chocolate ao Leite',
        }),
      ).rejects.toThrow('Connection refused');
    });
  });

  describe('cadastrarMaterial', () => {
    it('should send correct payload to Integrador', async () => {
      const { service, mocks } = makeService();

      await service.cadastrarMaterial(baseInput);

      expect(mocks.integradorClient.post).toHaveBeenCalledWith(
        '/Cadastrar',
        expect.objectContaining({
          pin: '',
          statusRegistro: 'L',
          codigoGrupo: '001',
          codigoSubGrupo: '01',
          codigoMaterial: 'MAT001',
          descricao: 'Chocolate ao Leite',
          tipo: 'A',
          codigoUnidadeMedida: 'UN',
          utilizaGrade: 'N',
        }),
        'producao',
      );
    });
  });

  describe('listarMateriais', () => {
    it('should return materials from Integrador', async () => {
      const materials = [
        { Codigo: 'MAT001', Descricao: 'Chocolate', CodigoGrupo: '001', CodigoSubGrupo: '01', CodigoUnidadeMedida: 'UN', Tipo: 'A' },
      ];
      const { service, mocks } = makeService({
        integradorClient: { get: vi.fn().mockResolvedValue(materials) },
      });

      const result = await service.listarMateriais();
      expect(result).toEqual(materials);
      expect(mocks.integradorClient.get).toHaveBeenCalledWith('/Listar', { params: { statusRegistro: 'L' } });
    });

    it('should return empty array when no materials exist', async () => {
      const { service, mocks } = makeService({
        integradorClient: { get: vi.fn().mockResolvedValue([]) },
      });

      const result = await service.listarMateriais();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return multiple materials', async () => {
      const materials = [
        { Codigo: 'MAT001', Descricao: 'Chocolate', CodigoGrupo: '001', CodigoSubGrupo: '01', CodigoUnidadeMedida: 'UN', Tipo: 'A' },
        { Codigo: 'MAT002', Descricao: 'Leite', CodigoGrupo: '002', CodigoSubGrupo: '02', CodigoUnidadeMedida: 'L', Tipo: 'B' },
        { Codigo: 'MAT003', Descricao: 'Açúcar', CodigoGrupo: '003', CodigoSubGrupo: '03', CodigoUnidadeMedida: 'KG', Tipo: 'C' },
      ];
      const { service, mocks } = makeService({
        integradorClient: { get: vi.fn().mockResolvedValue(materials) },
      });

      const result = await service.listarMateriais();
      expect(result).toHaveLength(3);
      expect(result[0].Codigo).toBe('MAT001');
      expect(result[1].Codigo).toBe('MAT002');
      expect(result[2].Codigo).toBe('MAT003');
    });

    it('should throw when Integrador get fails', async () => {
      const { service } = makeService({
        integradorClient: {
          get: vi.fn().mockRejectedValue(new Error('Service unavailable')),
        },
      });

      await expect(service.listarMateriais()).rejects.toThrow('Service unavailable');
    });

    it('should use statusRegistro L (Liberado) as filter', async () => {
      const { service, mocks } = makeService({
        integradorClient: { get: vi.fn().mockResolvedValue([]) },
      });

      await service.listarMateriais();

      const calledParams = mocks.integradorClient.get.mock.calls[0][1];
      expect(calledParams.params.statusRegistro).toBe('L');
    });

    it('should call correct endpoint /Listar', async () => {
      const { service, mocks } = makeService({
        integradorClient: { get: vi.fn().mockResolvedValue([]) },
      });

      await service.listarMateriais();

      expect(mocks.integradorClient.get).toHaveBeenCalledTimes(1);
      expect(mocks.integradorClient.get.mock.calls[0][0]).toBe('/Listar');
    });
  });

  describe('sincronizarComLocal', () => {
    it('should create local products and De-Para mappings for new materials', async () => {
      const remoteMaterials = [
        { Codigo: 'MAT001', Descricao: 'Chocolate', CodigoGrupo: '001', CodigoSubGrupo: '01', CodigoUnidadeMedida: 'UN', Tipo: 'A' },
      ];
      const { service, mocks } = makeService({
        integradorClient: { get: vi.fn().mockResolvedValue(remoteMaterials) },
        produtoRepository: {
          create: vi.fn().mockResolvedValue({ id: 'local-uuid-1' }),
        },
      });

      const result = await service.sincronizarComLocal();
      expect(result.materiaisEncontrados).toBe(1);
      expect(result.criadosLocais).toBe(1);
      expect(result.mapeamentosCriados).toBe(1);
      expect(result.erros).toHaveLength(0);
      expect(mocks.produtoRepository.create).toHaveBeenCalledWith({
        nome: 'Chocolate',
        preco: 0,
        temVariacoes: false,
        quantidade_estoque: 0,
        ativo: true,
      });
      expect(mocks.deParaProdutosRepository.create).toHaveBeenCalledWith({
        id_bling: 'local-uuid-1',
        id_cigam: 'MAT001',
        nome: 'Chocolate',
      });
    });

    it('should skip materials already mapped', async () => {
      const remoteMaterials = [
        { Codigo: 'MAT001', Descricao: 'Chocolate', CodigoGrupo: '001', CodigoSubGrupo: '01', CodigoUnidadeMedida: 'UN', Tipo: 'A' },
      ];
      const { service, mocks } = makeService({
        integradorClient: { get: vi.fn().mockResolvedValue(remoteMaterials) },
        deParaProdutosRepository: {
          findAll: vi.fn().mockResolvedValue([{ id_cigam: 'MAT001', id_bling: 'local-uuid-1' }]),
        },
      });

      const result = await service.sincronizarComLocal();
      expect(result.criadosLocais).toBe(0);
      expect(mocks.produtoRepository.create).not.toHaveBeenCalled();
    });
  });
});
