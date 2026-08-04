import { describe, it, expect } from 'vitest';
import { validateCreateTransportadorasCigam } from '../transportadorasCigam.validator';

describe('TransportadorasCigamValidator', () => {
  const validInput = {
    id_cigam: 'cigam-transp-001',
    nome: 'Trans ABC',
  };

  it('should accept valid input', () => {
    expect(() => validateCreateTransportadorasCigam(validInput)).not.toThrow();
  });

  it('should accept input with only required fields', () => {
    expect(() => validateCreateTransportadorasCigam({ id_cigam: 't1', nome: 'Trans' })).not.toThrow();
  });

  it('should reject missing id_cigam', () => {
    const { id_cigam, ...rest } = validInput;
    expect(() => validateCreateTransportadorasCigam(rest)).toThrow('Dados inválidos');
  });

  it('should reject missing nome', () => {
    const { nome, ...rest } = validInput;
    expect(() => validateCreateTransportadorasCigam(rest)).toThrow('Dados inválidos');
  });

  it('should apply defaults for codigo_divisao and ativo', () => {
    const result = validateCreateTransportadorasCigam({ id_cigam: 't1', nome: 'Trans' });
    expect(result.codigo_divisao).toBe("70");
    expect(result.ativo).toBe(true);
  });

  it('should reject null input', () => {
    expect(() => validateCreateTransportadorasCigam(null)).toThrow('Dados inválidos');
  });
});
