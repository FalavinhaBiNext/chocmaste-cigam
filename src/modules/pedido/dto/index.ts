export interface CreatePedidoDTO {
  id_bling: string;
  codigo_curto: string;
  numero_loja: string;
  data_pedido: string;
  total_produtos: number;
  total_venda: number;
  id_cliente_bling: string;
  nome_cliente: string;
  documento_cliente: string;
  tipo_pessoa: string;
  id_loja: string;
  desconto: number;
  quantidade_itens: number;
  status_venda: string;
  codigo_transportadora: string;
  valor_frete: number;
  nome_transportadora: string;
  codigo_rastreio: string;
  unidade_negocio?: string;
  data_prevista?: string;
}

export interface ResponsePedidoDTO {
  id: string;
  id_bling: string;
  codigo_curto: string;
  numero_loja: string;
  data_pedido: string;
  total_produtos: number;
  total_venda: number;
  id_cliente_bling: string;
  nome_cliente: string;
  documento_cliente: string;
  tipo_pessoa: string;
  id_loja: string;
  desconto: number;
  quantidade_itens: number;
  status_venda: string;
  codigo_transportadora: string;
  valor_frete: number;
  nome_transportadora: string;
  codigo_rastreio: string;
  unidade_negocio: string | null;
  data_prevista: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UpdatePedidoDTO {
  id_bling?: string;
  codigo_curto?: string;
  numero_loja?: string;
  data_pedido?: string;
  total_produtos?: number;
  total_venda?: number;
  id_cliente_bling?: string;
  nome_cliente?: string;
  documento_cliente?: string;
  tipo_pessoa?: string;
  id_loja?: string;
  desconto?: number;
  quantidade_itens?: number;
  status_venda?: string;
  codigo_transportadora?: string;
  valor_frete?: number;
  nome_transportadora?: string;
  codigo_rastreio?: string;
  unidade_negocio?: string;
  data_prevista?: string;
}
