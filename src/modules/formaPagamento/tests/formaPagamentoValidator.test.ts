import { describe, it, expect } from 'vitest';
import { validateCreateFormaPagamento } from '../formaPagamento.validator';

describe('FormaPagamentoValidator', () => {
  it('accept valid input', () => {
    expect(() => validateCreateFormaPagamento({ id_bling: 'b1', descricao: 'Cartão' })).not.toThrow();
  });

  it('reject missing id_bling', () => {
    expect(() => validateCreateFormaPagamento({ descricao: 'Cartão' })).toThrow('Dados inválidos.');
  });

  it('reject missing descricao', () => {
    expect(() => validateCreateFormaPagamento({ id_bling: 'b1' })).toThrow('Dados inválidos.');
  });

  it('default active=true', () => {
    const r = validateCreateFormaPagamento({ id_bling: 'b1', descricao: 'Cartão' });
    expect(r.active).toBe(true);
  });

  it('reject null', () => {
    expect(() => validateCreateFormaPagamento(null)).toThrow('Dados inválidos');
  });
});
