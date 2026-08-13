export interface CreateClientesDTO {
  id_bling?: string;
  id_cigam?: string;
  nome: string;
  documento?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  ie?: string;
  tipo?: string;
  active?: boolean;
}

export interface ResponseClientesDTO {
  id: string;
  id_bling: string | null;
  nome: string;
  documento: string | null;
  telefone: string | null;
  celular: string | null;
  email: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  ie: string | null;
  tipo: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateClientesDTO {
  id_bling?: string;
  id_cigam?: string;
  nome?: string;
  documento?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  ie?: string;
  tipo?: string;
  active?: boolean;
}
