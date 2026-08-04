import { describe, it, expect } from 'vitest';
import { validateCreatePedidoProduto } from '../pedidoProduto.validator';

describe('PedidoProdutoValidator', () => {
  const validInput = {
    id_pedido: '550e8400-e29b-41d4-a716-446655440000',
    id_produto: '550e8400-e29b-41d4-a716-446655440001',
    quantidade: 5,
    preco: 10.00,
    total: 50.00,
  };

  it('accept valid input', () => {
    expect(() => validateCreatePedidoProduto(validInput)).not.toThrow();
  });

  it('reject missing id_pedido', () => {
    const { id_pedido, ...rest } = validInput;
    expect(() => validateCreatePedidoProduto(rest)).toThrow('Dados inválidos.');
  });

  it('reject missing id_produto', () => {
    const { id_produto, ...rest } = validInput;
    expect(() => validateCreatePedidoProduto(rest)).toThrow('Dados inválidos.');
  });

  it('reject negative quantidade', () => {
    expect(() => validateCreatePedidoProduto({ ...validInput, quantidade: -1 })).toThrow('Dados inválidos.');
  });

  it('reject zero quantidade', () => {
    expect(() => validateCreatePedidoProduto({ ...validInput, quantidade: 0 })).toThrow('Dados inválidos.');
  });

  it('reject negative preco', () => {
    expect(() => validateCreatePedidoProduto({ ...validInput, preco: -10 })).toThrow('Dados inválidos.');
  });

  it('reject null', () => {
    expect(() => validateCreatePedidoProduto(null)).toThrow('Dados inválidos');
  });
});
