import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CigamSyncService } from '../services/cigamSyncService';
import { NotFoundError } from '@/shared/errors/AppError';

function makeService(mocks: any = {}) {
  const usuarioCigamService = {
    findByEnv: vi.fn().mockResolvedValue({ url_ambiente: 'https://cigam.test.com', ambiente: 'producao' }),
    ...mocks.usuarioCigamService,
  };

  const cigamHttpClient = {
    get: vi.fn(),
    ...mocks.cigamHttpClient,
  };

  const produtosCigamService = {
    findByIdCigam: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    ...mocks.produtosCigamService,
  };

  const clientesCigamService = {
    findByIdCigam: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    ...mocks.clientesCigamService,
  };

  const transportadorasCigamService = {
    findByIdCigam: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    ...mocks.transportadorasCigamService,
  };

  const formasPagamentoCigamService = {
    findByIdCigam: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    ...mocks.formasPagamentoCigamService,
  };

  return new CigamSyncService(
    cigamHttpClient as any,
    usuarioCigamService as any,
    produtosCigamService as any,
    clientesCigamService as any,
    formasPagamentoCigamService as any,
    transportadorasCigamService as any,
  );
}

describe('CigamSyncService', () => {
  describe('syncProdutos', () => {
    it('should create items when they do not exist locally', async () => {
      const svc = makeService({
        cigamHttpClient: {
          get: vi.fn().mockResolvedValue([
            { Material: { Codigo: 'P001', Descricao: 'Chocolate', CodigoUnidadeMedida: 'UN' } },
          ]),
        },
        produtosCigamService: {
          findByIdCigam: vi.fn().mockRejectedValue(new NotFoundError('not found')),
          create: vi.fn().mockResolvedValue({ id: 'new-1' }),
        },
      });

      const result = await svc.syncProdutos('producao');
      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should update items that already exist locally', async () => {
      const svc = makeService({
        cigamHttpClient: {
          get: vi.fn().mockResolvedValue([
            { Material: { Codigo: 'P001', Descricao: 'Chocolate Atualizado', CodigoUnidadeMedida: 'UN' } },
          ]),
        },
        produtosCigamService: {
          findByIdCigam: vi.fn().mockResolvedValue({ id: 'existing-1' }),
          update: vi.fn().mockResolvedValue({ id: 'existing-1' }),
        },
      });

      const result = await svc.syncProdutos('producao');
      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      const svc = makeService({
        cigamHttpClient: {
          get: vi.fn().mockRejectedValue(new Error('API timeout')),
        },
      });

      const result = await svc.syncProdutos('producao');
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('API timeout');
    });
  });

  describe('syncClientes', () => {
    it('should create and update based on existence', async () => {
      const svc = makeService({
        cigamHttpClient: {
          get: vi.fn().mockResolvedValue([
            { Codigo: 'C001', NomeCompleto: 'João', CnpjCpf: '12345678901', Ativo: true },
            { Codigo: 'C002', NomeCompleto: 'Empresa XYZ', CnpjCpf: '11222333000181', Ativo: true },
          ]),
        },
        clientesCigamService: {
          findByIdCigam: vi.fn()
            .mockRejectedValueOnce(new NotFoundError('not found'))
            .mockResolvedValueOnce({ id: 'existing-2' }),
          create: vi.fn().mockResolvedValue({ id: 'new-1' }),
          update: vi.fn().mockResolvedValue({ id: 'existing-2' }),
        },
      });

      const result = await svc.syncClientes('producao');
      expect(result.created).toBe(1);
      expect(result.updated).toBe(1);
    });

    it('should derive tipo_pessoa from documento length', async () => {
      let createdData: any;
      const svc = makeService({
        cigamHttpClient: {
          get: vi.fn().mockResolvedValue([
            { Codigo: 'C001', NomeCompleto: 'João', CnpjCpf: '12345678901', Ativo: true },
          ]),
        },
        clientesCigamService: {
          findByIdCigam: vi.fn().mockRejectedValue(new NotFoundError('not found')),
          create: vi.fn().mockImplementation((data) => { createdData = data; return { id: 'new' }; }),
        },
      });

      await svc.syncClientes('producao');
      expect(createdData.tipo_pessoa).toBe('F');

      createdData = null;
      svc['clientesCigamService'].findByIdCigam = vi.fn().mockRejectedValue(new NotFoundError('not found'));
      svc['cigamHttpClient'].get = vi.fn().mockResolvedValue([
        { Codigo: 'C002', NomeCompleto: 'Empresa', CnpjCpf: '11222333000181', Ativo: true },
      ]);
      svc['clientesCigamService'].create = vi.fn().mockImplementation((data) => { createdData = data; return { id: 'new' }; });

      await svc.syncClientes('producao');
      expect(createdData.tipo_pessoa).toBe('J');
    });
  });

  describe('syncTransportadoras', () => {
    it('should only sync items with Divisao = 70', async () => {
      const svc = makeService({
        cigamHttpClient: {
          get: vi.fn().mockResolvedValue([
            { Codigo: 'T001', NomeCompleto: 'Trans A', Divisao: '70', Ativo: true },
            { Codigo: 'T002', NomeCompleto: 'Trans B', Divisao: '50', Ativo: true },
          ]),
        },
        transportadorasCigamService: {
          findByIdCigam: vi.fn().mockRejectedValue(new NotFoundError('not found')),
          create: vi.fn().mockResolvedValue({ id: 'new' }),
        },
      });

      const result = await svc.syncTransportadoras('producao');
      expect(result.created).toBe(1);
    });
  });

  describe('syncFormasPagamento', () => {
    it('should sync payment methods', async () => {
      const svc = makeService({
        cigamHttpClient: {
          get: vi.fn().mockResolvedValue([
            { Codigo: 'FP01', Descricao: 'Cartão Crédito', Forma: 'C', Ativo: true },
          ]),
        },
        formasPagamentoCigamService: {
          findByIdCigam: vi.fn().mockRejectedValue(new NotFoundError('not found')),
          create: vi.fn().mockResolvedValue({ id: 'new' }),
        },
      });

      const result = await svc.syncFormasPagamento('producao');
      expect(result.created).toBe(1);
    });
  });

  describe('syncAll', () => {
    it('should sync all entities', async () => {
      const svc = makeService({
        cigamHttpClient: {
          get: vi.fn().mockResolvedValue([]),
        },
        produtosCigamService: {
          findByIdCigam: vi.fn().mockRejectedValue(new NotFoundError('not found')),
          create: vi.fn().mockResolvedValue({ id: 'new' }),
        },
        clientesCigamService: {
          findByIdCigam: vi.fn().mockRejectedValue(new NotFoundError('not found')),
          create: vi.fn().mockResolvedValue({ id: 'new' }),
        },
        transportadorasCigamService: {
          findByIdCigam: vi.fn().mockRejectedValue(new NotFoundError('not found')),
          create: vi.fn().mockResolvedValue({ id: 'new' }),
        },
        formasPagamentoCigamService: {
          findByIdCigam: vi.fn().mockRejectedValue(new NotFoundError('not found')),
          create: vi.fn().mockResolvedValue({ id: 'new' }),
        },
      });

      const result = await svc.syncAll('producao');
      expect(result.entity).toBe('all');
      expect(result.created).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});
