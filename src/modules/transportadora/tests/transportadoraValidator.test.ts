import { describe, it, expect } from 'vitest';
import { validateCreateTransportadora } from '../transportadora.validator';

describe('TransportadoraValidator', () => {
  it('accept valid input', () => {
    expect(() => validateCreateTransportadora({ id_bling: 'b1', nome: 'Trans ABC' })).not.toThrow();
  });

  it('reject missing id_bling', () => {
    expect(() => validateCreateTransportadora({ nome: 'Trans' })).toThrow('Dados inválidos.');
  });

  it('reject missing nome', () => {
    expect(() => validateCreateTransportadora({ id_bling: 'b1' })).toThrow('Dados inválidos.');
  });

  it('default active=true', () => {
    const r = validateCreateTransportadora({ id_bling: 'b1', nome: 'Trans' });
    expect(r.active).toBe(true);
  });

  it('reject null', () => {
    expect(() => validateCreateTransportadora(null)).toThrow('Dados inválidos');
  });
});
