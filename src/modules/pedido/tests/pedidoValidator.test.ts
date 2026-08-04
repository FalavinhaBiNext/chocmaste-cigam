import { describe, it, expect } from 'vitest';
import { validateCreatePedido } from '../pedido.validator';

describe('PedidoValidator', () => {
  const validInput = {
    id_bling: 'bling-123',
    codigo_curto: 'CC-001',
    numero_loja: 'LOJA-001',
    data_pedido: '2024-01-15',
    total_produtos: 100.50,
    total_venda: 120.00,
    id_cliente_bling: 'cliente-001',
    nome_cliente: 'João Silva',
    documento_cliente: '12345678901',
    tipo_pessoa: 'F',
    id_loja: 'loja-01',
    desconto: 10.00,
    quantidade_itens: 3,
    status_venda: 'em_andamento',
    codigo_transportadora: 'transp-001',
    valor_frete: 15.50,
    nome_transportadora: 'Transportadora XYZ',
    codigo_rastreio: 'BR123456789',
  };

  it('should accept valid input', () => {
    expect(() => validateCreatePedido(validInput)).not.toThrow();
  });

  it('should reject missing id_bling', () => {
    const { id_bling, ...rest } = validInput;
    expect(() => validateCreatePedido(rest)).toThrow('Dados inválidos.');
  });

  it('should reject missing nome_cliente', () => {
    const { nome_cliente, ...rest } = validInput;
    expect(() => validateCreatePedido(rest)).toThrow('Dados inválidos.');
  });

  it('should reject invalid total_produtos type', () => {
    expect(() => validateCreatePedido({ ...validInput, total_produtos: 'abc' })).toThrow('Dados inválidos');
  });

  it('should reject empty object', () => {
    expect(() => validateCreatePedido({})).toThrow('Dados inválidos');
  });

  it('should reject null input', () => {
    expect(() => validateCreatePedido(null)).toThrow('Dados inválidos');
  });
});
