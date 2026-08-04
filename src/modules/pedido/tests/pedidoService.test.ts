import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PedidoService } from '../services/pedidoService';
import { NotFoundError } from '@/shared/errors/AppError';

describe('PedidoService', () => {
  let service: PedidoService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      findByIdBling: vi.fn(),
      findByNumeroLoja: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new PedidoService(mockRepository);
  });

  describe('create', () => {
    it('should call repository.create and return result', async () => {
      const input = { id_bling: '1' } as any;
      const expected = { id: 'uuid', id_bling: '1' };
      mockRepository.create.mockResolvedValue(expected);

      const result = await service.create(input);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should return all pedidos', async () => {
      const expected = [{ id: '1' }, { id: '2' }];
      mockRepository.findAll.mockResolvedValue(expected);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result).toEqual(expected);
    });

    it('should return empty array when none exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return pedido when found', async () => {
      const expected = { id: '123', id_bling: 'bling-1' };
      mockRepository.findById.mockResolvedValue(expected);

      const result = await service.findById('123');
      expect(result).toEqual(expected);
    });

    it('should throw NotFoundError when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.findById('999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByIdBling', () => {
    it('should return pedido when found by bling id', async () => {
      const expected = { id: '123', id_bling: 'bling-1' };
      mockRepository.findByIdBling.mockResolvedValue(expected);

      const result = await service.findByIdBling('bling-1');
      expect(result).toEqual(expected);
    });

    it('should throw NotFoundError when not found', async () => {
      mockRepository.findByIdBling.mockResolvedValue(null);
      await expect(service.findByIdBling('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByNumeroLoja', () => {
    it('should return pedido when found by numero loja', async () => {
      const expected = { id: '123', numero_loja: 'LOJA-001' };
      mockRepository.findByNumeroLoja.mockResolvedValue(expected);

      const result = await service.findByNumeroLoja('LOJA-001');
      expect(result).toEqual(expected);
    });

    it('should throw NotFoundError when not found', async () => {
      mockRepository.findByNumeroLoja.mockResolvedValue(null);
      await expect(service.findByNumeroLoja('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update pedido when it exists', async () => {
      const existing = { id: '123', nome_cliente: 'João' };
      const updateData = { nome_cliente: 'Maria' };
      const updated = { id: '123', nome_cliente: 'Maria' };
      mockRepository.findById.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('123', updateData);
      expect(mockRepository.update).toHaveBeenCalledWith('123', updateData);
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundError when pedido does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.update('999', {} as any)).rejects.toThrow(NotFoundError);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete pedido when it exists', async () => {
      mockRepository.findById.mockResolvedValue({ id: '123' });
      mockRepository.delete.mockResolvedValue(undefined);

      await service.delete('123');
      expect(mockRepository.delete).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundError when pedido does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.delete('999')).rejects.toThrow(NotFoundError);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
