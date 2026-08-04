export interface CreateFormaPagamentoDTO {
  id_bling: string;
  descricao: string;
  tipo?: string;
  id_cigam?: string;
  active?: boolean;
}

export interface ResponseFormaPagamentoDTO {
  id: string;
  id_bling: string;
  descricao: string;
  tipo: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateFormaPagamentoDTO {
  id_bling?: string;
  descricao?: string;
  tipo?: string;
  id_cigam?: string;
  active?: boolean;
}
