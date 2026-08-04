export interface CreateFormasPagamentoCigamDTO {
  id_cigam: string;
  descricao: string;
  tipo?: string;
  ativo?: boolean;
}

export interface ResponseFormasPagamentoCigamDTO {
  id: string;
  id_cigam: string;
  descricao: string;
  tipo: string | null;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateFormasPagamentoCigamDTO {
  id_cigam?: string;
  descricao?: string;
  tipo?: string;
  ativo?: boolean;
}
