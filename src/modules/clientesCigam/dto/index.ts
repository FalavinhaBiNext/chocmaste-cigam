export interface CreateClientesCigamDTO {
  id_cigam: string;
  nome: string;
  documento?: string;
  tipo_pessoa?: string;
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
  ativo?: boolean;
}

export interface ResponseClientesCigamDTO {
  id: string;
  id_cigam: string;
  nome: string;
  documento: string | null;
  tipo_pessoa: string | null;
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
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateClientesCigamDTO {
  id_cigam?: string;
  nome?: string;
  documento?: string;
  tipo_pessoa?: string;
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
  ativo?: boolean;
}
