export interface CreateBlingTokenDTO {
  access_token: string;
  refresh_token: string;
  expires_at?: Date;
  scope?: string;
  token_type?: string;
  access_token_url?: string;
  client_id?: string;
  client_secret?: string;
  active?: boolean;
  nome_unidade?: string;
}

export interface ResponseBlingTokenDTO {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_at: Date | null;
  scope: string | null;
  token_type: string | null;
  access_token_url: string;
  client_id: string;
  client_secret: string;
  active: boolean;
  nome_unidade: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateBlingTokenDTO {
  access_token?: string;
  refresh_token?: string;
  access_token_url?: string;
  client_id?: string;
  client_secret?: string;
  expires_at?: Date;
  scope?: string;
  token_type?: string;
  active?: boolean;
  nome_unidade?: string;
}

export interface BlingAuthUrlDTO {
  url: string;
  state: string;
}

export interface ProdutoBlingDTO {
  id: number;
  nome: string;
  codigo: string;
  preco: number;
  tipo: string;
  situacao: string;
  descricao: string;
  unidade: string;
  categoria?: { id: number; descricao: string };
  marca?: { id: number; nome: string };
  estoque?: { saldoFisico: number };
}

export interface ProdutoBlingResponse {
  data: ProdutoBlingDTO;
}

export interface ContatoBlingEnderecoDetalhadoDTO {
  endereco: string;
  cep: string;
  bairro: string;
  municipio: string;
  uf: string;
  numero: string;
  complemento: string;
}

export interface ContatoBlingDTO {
  id: number;
  nome: string;
  codigo: string | null;
  situacao: string;
  numeroDocumento: string;
  fantasia: string;
  tipoPessoa: string;
  cpfCnpj: string;
  tipo: string;
  ie: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  contribuinte: string;
  dataCriacao: string;
  dataAlteracao: string;
  endereco: {
    geral: ContatoBlingEnderecoDetalhadoDTO;
    cobranca: ContatoBlingEnderecoDetalhadoDTO;
  } | null;
}

export interface ContatoBlingListResponse {
  data: ContatoBlingDTO[];
}

export interface ContatoBlingSingleResponse {
  data: ContatoBlingDTO;
}

export interface BlingFormaPagamentoDTO {
  id: number;
  descricao: string;
  situacao: string;
  padrao: boolean;
  ativo: boolean;
  codigo: string | null;
}

export interface BlingFormaPagamentoResponse {
  data: BlingFormaPagamentoDTO;
}

export interface BlingPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface BlingPaginatedResponse<T> {
  data: T[];
  pagination: BlingPagination;
}

export interface BlingProdutosListResponse extends BlingPaginatedResponse<ProdutoBlingDTO> {}
export interface BlingContatosListResponse extends BlingPaginatedResponse<ContatoBlingDTO> {}
export interface BlingFormasPagamentoListResponse extends BlingPaginatedResponse<BlingFormaPagamentoDTO> {}

export interface SyncBlingResultDTO {
  entity: string;
  imported: number;
  updated: number;
  errors: string[];
}
