import { describe, it, expect } from 'vitest';
import { validateCreateClientesCigam } from '../clientesCigam.validator';

describe('ClientesCigamValidator', () => {
  const validInput = {
    id_cigam: 'cigam-cli-001',
    nome: 'Maria',
  };

  it('should accept valid input', () => {
    expect(() => validateCreateClientesCigam(validInput)).not.toThrow();
  });

  it('should accept input with only required fields', () => {
    expect(() => validateCreateClientesCigam({ id_cigam: 'cc1', nome: 'Maria' })).not.toThrow();
  });

  it('should reject missing id_cigam', () => {
    const { id_cigam, ...rest } = validInput;
    expect(() => validateCreateClientesCigam(rest)).toThrow('Dados inválidos');
  });

  it('should reject missing nome', () => {
    const { nome, ...rest } = validInput;
    expect(() => validateCreateClientesCigam(rest)).toThrow('Dados inválidos');
  });

  it('should apply defaults for ativo', () => {
    const result = validateCreateClientesCigam({ id_cigam: 'cc1', nome: 'Maria' });
    expect(result.ativo).toBe(true);
  });

  it('should reject null input', () => {
    expect(() => validateCreateClientesCigam(null)).toThrow('Dados inválidos');
  });
});
