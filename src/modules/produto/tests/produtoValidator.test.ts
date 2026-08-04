import { describe, it, expect } from 'vitest';
import { validateCreateProduto } from '../produto.validator';

describe('ProdutoValidator', () => {
  const validInput = {
    id_bling: 'bling-prod-001',
    id_produto: 'prod-001',
    nome: 'Chocolate Amargo',
    preco: 12.90,
    quantidade_estoque: 100,
    ativo: true,
  };

  it('should accept valid input', () => {
    expect(() => validateCreateProduto(validInput)).not.toThrow();
  });

  it('should accept input with only required fields', () => {
    expect(() => validateCreateProduto({ nome: 'Chocolate', preco: 10 })).not.toThrow();
  });

  it('should reject missing nome', () => {
    expect(() => validateCreateProduto({ preco: 10 })).toThrow('Dados inválidos.');
  });

  it('should reject missing preco', () => {
    expect(() => validateCreateProduto({ nome: 'Choco' })).toThrow('Dados inválidos');
  });

  it('should apply defaults for estoque and ativo', () => {
    const result = validateCreateProduto({ nome: 'Choco', preco: 10 });
    expect(result.quantidade_estoque).toBe(0);
    expect(result.ativo).toBe(true);
  });

  it('should reject null input', () => {
    expect(() => validateCreateProduto(null)).toThrow('Dados inválidos');
  });
});
