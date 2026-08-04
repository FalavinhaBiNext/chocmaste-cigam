export interface BlingContatoDTO {
  id: number;
  nome?: string;
  tipoPessoa?: string;
  cpfCnpj?: string;
}

export interface BlingLojaDTO {
  id: number;
}

export interface BlingTransportadorDTO {
  id: number;
  nome?: string;
  fretePorConta?: string;
  qtdeVolumes?: number;
  pesoBruto?: number;
}

export interface BlingSituacaoDTO {
  id: number;
  valor?: number;
}

export interface BlingItemDTO {
  id: string;
  codigo?: string;
  descricao?: string;
  quantidade: number;
  valor: number;
  valorTotal: number;
}

export interface BlingFormaPagamentoDTO {
  id: number;
  descricao?: string;
}

export interface BlingParcelaDTO {
  id?: number;
  dataVencimento: string;
  valor: number;
  formaPagamento?: BlingFormaPagamentoDTO;
}

export interface BlingPedidoDataDTO {
  transporte: any;
  id: number;
  numero: string;
  numeroLoja: string;
  data: string;
  dataSaida?: string;
  dataPrevisao?: string;
  totalProdutos: number;
  total: number;
  desconto?: number;
  contato: BlingContatoDTO;
  loja: BlingLojaDTO;
  transportador?: BlingTransportadorDTO;
  situacao: BlingSituacaoDTO;
  itens: BlingItemDTO[];
  parcelas?: BlingParcelaDTO[];
}

export interface BlingPedidoResponse {
  data: BlingPedidoDataDTO;
}
