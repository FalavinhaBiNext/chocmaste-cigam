export function createPedidoInput(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

export function createProdutoInput(overrides: Record<string, unknown> = {}) {
  return {
    id_bling: 'bling-prod-001',
    id_produto: 'prod-001',
    nome: 'Chocolate Amargo 70%',
    preco: 12.90,
    temVariacoes: false,
    quantidade_estoque: 100,
    ativo: true,
    ...overrides,
  };
}

export function createClienteInput(overrides: Record<string, unknown> = {}) {
  return {
    id_bling: 'bling-cli-001',
    nome: 'Maria Oliveira',
    documento: '98765432100',
    email: 'maria@email.com',
    telefone: '11999999999',
    celular: '11988888888',
    endereco: 'Rua das Flores',
    numero: '123',
    complemento: 'Apto 45',
    bairro: 'Centro',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01001000',
    active: true,
    ...overrides,
  };
}

export function createTransportadoraInput(overrides: Record<string, unknown> = {}) {
  return {
    id_bling: 'bling-transp-001',
    nome: 'Transportadora ABC Ltda',
    fantasia: 'Trans ABC',
    documento: '11222333000181',
    active: true,
    ...overrides,
  };
}

export function createFormaPagamentoInput(overrides: Record<string, unknown> = {}) {
  return {
    id_bling: 'bling-fp-001',
    descricao: 'Cartão de Crédito',
    tipo: 'credito',
    active: true,
    ...overrides,
  };
}

export function createPedidoProdutoInput(overrides: Record<string, unknown> = {}) {
  return {
    id_pedido: '00000000-0000-0000-0000-000000000001',
    id_produto: '00000000-0000-0000-0000-000000000002',
    quantidade: 5,
    preco: 10.00,
    total: 50.00,
    ...overrides,
  };
}

export function createProdutosCigamInput(overrides: Record<string, unknown> = {}) {
  return {
    id_cigam: 'cigam-prod-001',
    nome: 'Chocolate Amargo 70%',
    preco: 12.90,
    unidade: 'UN',
    ncm: '1806.32.00',
    quantidade_estoque: 100,
    ativo: true,
    ...overrides,
  };
}

export function createClientesCigamInput(overrides: Record<string, unknown> = {}) {
  return {
    id_cigam: 'cigam-cli-001',
    nome: 'Maria Oliveira',
    documento: '98765432100',
    tipo_pessoa: 'F',
    email: 'maria@email.com',
    telefone: '11999999999',
    celular: '11988888888',
    endereco: 'Rua das Flores',
    numero: '123',
    complemento: 'Apto 45',
    bairro: 'Centro',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01001000',
    ativo: true,
    ...overrides,
  };
}

export function createFormasPagamentoCigamInput(overrides: Record<string, unknown> = {}) {
  return {
    id_cigam: 'cigam-fp-001',
    descricao: 'Cartão de Crédito',
    tipo: 'credito',
    ativo: true,
    ...overrides,
  };
}

export function createTransportadorasCigamInput(overrides: Record<string, unknown> = {}) {
  return {
    id_cigam: 'cigam-transp-001',
    nome: 'Transportadora ABC Ltda',
    fantasia: 'Trans ABC',
    documento: '11222333000181',
    codigo_divisao: '70',
    ativo: true,
    ...overrides,
  };
}

export function createEventInput(overrides: Record<string, unknown> = {}) {
  return {
    event: 'order.created',
    company_id: 'company-001',
    pedido_id: 12345,
    data_pedido: '2024-01-15',
    numero_pedido: 1001,
    numero_loja: 'LOJA-001',
    total_pedido: 250.00,
    ...overrides,
  };
}
