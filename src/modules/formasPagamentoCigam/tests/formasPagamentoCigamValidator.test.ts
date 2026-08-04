import { describe, it, expect } from 'vitest';
import { validateCreateFormasPagamentoCigam } from '../formasPagamentoCigam.validator';

describe('FormasPagamentoCigamValidator', () => {
  const validInput = {
    id_cigam: 'cigam-fp-001',
    descricao: 'Cartão',
  };

  it('should accept valid input', () => {
    expect(() => validateCreateFormasPagamentoCigam(validInput)).not.toThrow();
  });

  it('should accept input with only required fields', () => {
    expect(() => validateCreateFormasPagamentoCigam({ id_cigam: 'fp1', descricao: 'Cartão' })).not.toThrow();
  });

  it('should reject missing id_cigam', () => {
    const { id_cigam, ...rest } = validInput;
    expect(() => validateCreateFormasPagamentoCigam(rest)).toThrow('Dados inválidos');
  });

  it('should reject missing descricao', () => {
    const { descricao, ...rest } = validInput;
    expect(() => validateCreateFormasPagamentoCigam(rest)).toThrow('Dados inválidos');
  });

  it('should apply defaults for ativo', () => {
    const result = validateCreateFormasPagamentoCigam({ id_cigam: 'fp1', descricao: 'Cartão' });
    expect(result.ativo).toBe(true);
  });

  it('should reject null input', () => {
    expect(() => validateCreateFormasPagamentoCigam(null)).toThrow('Dados inválidos');
  });
});
