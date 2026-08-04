export interface CreateTransportadorasCigamDTO {
  id_cigam: string;
  nome: string;
  fantasia?: string;
  documento?: string;
  codigo_divisao?: string;
  ativo?: boolean;
}

export interface ResponseTransportadorasCigamDTO {
  id: string;
  id_cigam: string;
  nome: string;
  fantasia: string | null;
  documento: string | null;
  codigo_divisao: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateTransportadorasCigamDTO {
  id_cigam?: string;
  nome?: string;
  fantasia?: string;
  documento?: string;
  codigo_divisao?: string;
  ativo?: boolean;
}
