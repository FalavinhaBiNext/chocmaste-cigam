export interface CreateTransportadoraDTO {
  id_bling: string;
  nome: string;
  fantasia?: string;
  documento?: string;
  active?: boolean;
}

export interface ResponseTransportadoraDTO {
  id: string;
  id_bling: string;
  nome: string;
  fantasia: string;
  documento: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateTransportadoraDTO {
  id_bling?: string;
  nome?: string;
  fantasia?: string;
  documento?: string;
  id_cigam?: string;
  codigo_divisao_cigam?: string;
  active?: boolean;
}