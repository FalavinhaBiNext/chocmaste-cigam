import { describe, it, expect } from 'vitest';
import { validateCreateClientes } from '../clientes.validator';

describe('ClientesValidator', () => {
  const validInput = {
    id_bling: 'bling-cli-001',
    nome: 'Maria Oliveira',
    email: 'maria@email.com',
  };

  it('should accept valid input with only required fields', () => {
    expect(() => validateCreateClientes({ nome: 'João' })).not.toThrow();
  });

  it('should accept valid input with all fields', () => {
    expect(() => validateCreateClientes(validInput)).not.toThrow();
  });

  it('should reject missing nome', () => {
    expect(() => validateCreateClientes({})).toThrow('Dados inválidos.');
  });

  it('should apply default active=true', () => {
    const result = validateCreateClientes({ nome: 'João' });
    expect(result.active).toBe(true);
  });

  it('should reject null input', () => {
    expect(() => validateCreateClientes(null)).toThrow('Dados inválidos.');
  });
});
