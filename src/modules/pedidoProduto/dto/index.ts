export interface CreatePedidoProdutoDTO {
  id_pedido: string;
  id_produto: string;
  quantidade: number;
  preco: number;
  total: number;
}

export interface ResponsePedidoProdutoDTO {
  id: string;
  id_pedido: string;
  id_produto: string;
  quantidade: number;
  preco: number;
  total: number;
  created_at: Date;
  updated_at: Date;
}

export interface UpdatePedidoProdutoDTO {
  id_pedido?: string;
  id_produto?: string;
  quantidade?: number;
  preco?: number;
  total?: number;
}
