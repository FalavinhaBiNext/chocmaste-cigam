export interface CreateProdutosCigamDTO {
  id_cigam: string;
  nome: string;
  preco: number;
  unidade?: string;
  ncm?: string;
  quantidade_estoque?: number;
  ativo?: boolean;
}

export interface ResponseProdutosCigamDTO {
  id: string;
  id_cigam: string;
  nome: string;
  preco: number;
  unidade: string | null;
  ncm: string | null;
  quantidade_estoque: number;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateProdutosCigamDTO {
  id_cigam?: string;
  nome?: string;
  preco?: number;
  unidade?: string;
  ncm?: string;
  quantidade_estoque?: number;
  ativo?: boolean;
}
