import { describe, it, expect } from 'vitest';
import { validateCreateProdutosCigam } from '../produtosCigam.validator';

describe('ProdutosCigamValidator', () => {
  const validInput = {
    id_cigam: 'cigam-prod-001',
    nome: 'Chocolate Amargo',
    preco: 12.90,
    unidade: 'UN',
    ncm: '1806.32.00',
    quantidade_estoque: 100,
    ativo: true,
  };

  it('should accept valid input', () => {
    expect(() => validateCreateProdutosCigam(validInput)).not.toThrow();
  });

  it('should accept input with only required fields', () => {
    expect(() => validateCreateProdutosCigam({ id_cigam: 'cp1', nome: 'Choco', preco: 10 })).not.toThrow();
  });

  it('should reject missing id_cigam', () => {
    const { id_cigam, ...rest } = validInput;
    expect(() => validateCreateProdutosCigam(rest)).toThrow('Dados inválidos');
  });

  it('should reject missing nome', () => {
    const { nome, ...rest } = validInput;
    expect(() => validateCreateProdutosCigam(rest)).toThrow('Dados inválidos');
  });

  it('should apply defaults for quantidade_estoque and ativo', () => {
    const result = validateCreateProdutosCigam({ id_cigam: 'cp1', nome: 'Choco', preco: 10 });
    expect(result.quantidade_estoque).toBe(0);
    expect(result.ativo).toBe(true);
  });

  it('should reject null input', () => {
    expect(() => validateCreateProdutosCigam(null)).toThrow('Dados inválidos');
  });
});
