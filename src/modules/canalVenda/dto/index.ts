export interface CreateCanalVendaDTO {
  id_bling: string;
  descricao: string;
  tipo?: string;
  situacao?: string;
  ativo?: boolean;
  local_venda?: string;
  codigo_conta?: string;
}

export interface ResponseCanalVendaDTO {
  id: string;
  id_bling: string;
  descricao: string;
  tipo: string | null;
  situacao: string | null;
  ativo: boolean;
  local_venda: string | null;
  codigo_conta: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateCanalVendaDTO {
  id_bling?: string;
  descricao?: string;
  tipo?: string;
  situacao?: string;
  ativo?: boolean;
  local_venda?: string;
  codigo_conta?: string;
}

export interface BlingCanalVendaResponse {
  data: Array<{
    id: number;
    descricao: string;
    tipo: string;
    situacao: string;
  }>;
}
