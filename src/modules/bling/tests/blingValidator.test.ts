import { describe, it, expect } from 'vitest';
import { validateCallbackQuery, validateSaveToken } from '../bling.validator';
import { validatePedidoWebhook } from '../blingWebhook.validator';

describe('Bling Validators', () => {
  describe('validateCallbackQuery', () => {
    it('accept valid input', () => {
      expect(() => validateCallbackQuery({ code: 'abc123' })).not.toThrow();
    });

    it('accept input with optional state', () => {
      expect(() => validateCallbackQuery({ code: 'abc123', state: 'state-1' })).not.toThrow();
    });

    it('reject missing code', () => {
      expect(() => validateCallbackQuery({})).toThrow('Parâmetros inválidos no callback.');
    });

    it('reject null', () => {
      expect(() => validateCallbackQuery(null)).toThrow('Parâmetros inválidos no callback.');
    });
  });

  describe('validateSaveToken', () => {
    it('accept valid input', () => {
      expect(() => validateSaveToken({
        access_token: 'token-123',
        refresh_token: 'refresh-123',
      })).not.toThrow();
    });

    it('accept input with all fields', () => {
      expect(() => validateSaveToken({
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_at: '2025-01-01T00:00:00Z',
        active: true,
      })).not.toThrow();
    });

    it('reject missing access_token', () => {
      expect(() => validateSaveToken({ refresh_token: 'r' })).toThrow('Dados do token inválidos.');
    });

    it('reject missing refresh_token', () => {
      expect(() => validateSaveToken({ access_token: 'a' })).toThrow('Dados do token inválidos.');
    });

    it('default active=true', () => {
      const r = validateSaveToken({ access_token: 'a', refresh_token: 'r' });
      expect(r.active).toBe(true);
    });
  });

  describe('validatePedidoWebhook', () => {
    const validWebhook = {
      eventId: '550e8400-e29b-41d4-a716-446655440000',
      date: '2024-01-15T10:00:00Z',
      version: '1.0',
      event: 'order.created',
      companyId: 'company-001',
      data: {
        id: 12345,
        data: '2024-01-15',
        numero: 1001,
        numeroLoja: 'LOJA-001',
        total: 250.00,
        contato: { id: 1 },
        loja: { id: 1 },
      },
    };

    it('accept valid webhook payload', () => {
      expect(() => validatePedidoWebhook(validWebhook)).not.toThrow();
    });

    it('accept webhook with optional fields', () => {
      const w = {
        ...validWebhook,
        data: { ...validWebhook.data, vendedor: { id: 1 }, situacao: { id: 1, valor: 1 } },
      };
      expect(() => validatePedidoWebhook(w)).not.toThrow();
    });

    it('reject missing eventId', () => {
      const { eventId, ...rest } = validWebhook;
      expect(() => validatePedidoWebhook(rest)).toThrow('Payload do webhook inválido');
    });

    it('reject missing data.contato', () => {
      const { contato, ...dataRest } = validWebhook.data;
      expect(() => validatePedidoWebhook({ ...validWebhook, data: dataRest })).toThrow('Payload do webhook inválido');
    });

    it('reject null', () => {
      expect(() => validatePedidoWebhook(null)).toThrow('Payload do webhook inválido');
    });
  });
});
