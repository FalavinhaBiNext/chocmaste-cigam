import { describe, it, expect } from 'vitest';
import { validateCreateEvent, validateDeletePendingBatch, MAX_EVENTOS_EXCLUSAO_LOTE } from '../events.validator';

describe('EventValidator', () => {
  const validInput = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    event: 'order.created',
    company_id: 'company-001',
    pedido_id: 12345,
    data_pedido: '2024-01-15',
    numero_pedido: 1001,
    numero_loja: 'LOJA-001',
    total_pedido: 250.00,
  };

  it('accept valid input', () => {
    expect(() => validateCreateEvent(validInput)).not.toThrow();
  });

  it('accept input with optional data_pedido omitted', () => {
    const { data_pedido, ...rest } = validInput;
    expect(() => validateCreateEvent(rest)).not.toThrow();
  });

  it('reject missing event', () => {
    const { event, ...rest } = validInput;
    expect(() => validateCreateEvent(rest)).toThrow('Dados inválidos.');
  });

  it('reject missing company_id', () => {
    const { company_id, ...rest } = validInput;
    expect(() => validateCreateEvent(rest)).toThrow('Dados inválidos.');
  });

  it('reject invalid id format', () => {
    expect(() => validateCreateEvent({ ...validInput, id: 'not-a-uuid' })).toThrow('Dados inválidos');
  });

  it('reject null', () => {
    expect(() => validateCreateEvent(null)).toThrow('Dados inválidos');
  });

  describe('validateDeletePendingBatch', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';

    it('aceita uma lista de UUIDs', () => {
      expect(validateDeletePendingBatch({ ids: [uuid] })).toEqual({ ids: [uuid] });
    });

    it('rejeita lista vazia, ids inválidos e corpo ausente', () => {
      expect(() => validateDeletePendingBatch({ ids: [] })).toThrow('Dados inválidos');
      expect(() => validateDeletePendingBatch({ ids: ['x'] })).toThrow('Dados inválidos');
      expect(() => validateDeletePendingBatch(undefined)).toThrow('Dados inválidos');
    });

    it('rejeita lotes acima do limite', () => {
      const ids = Array.from({ length: MAX_EVENTOS_EXCLUSAO_LOTE + 1 }, () => uuid);
      expect(() => validateDeletePendingBatch({ ids })).toThrow('Dados inválidos');
    });
  });
});
