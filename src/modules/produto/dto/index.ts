export interface CreateProdutoDTO {
  id_bling?: string;
  id_produto?: string;
  nome: string;
  codigo?: string;
  preco: number;
  tipo?: string;
  situacao?: string;
  formato?: string;
  descricaoCurta?: string;
  unidade?: string;
  tipoProduto?: string;
  condicao?: number;
  marca?: string;
  categoria_id?: number;
  fornecedor_id?: number;
  fornecedor_nome?: string;
  fornecedor_codigo?: string;
  fornecedor_precoCusto?: number;
  ncm?: string;
  temVariacoes?: boolean;
  quantidade_estoque?: number;
  ativo?: boolean;
}

export interface ResponseProdutoDTO {
  id: string;
  id_bling: string | null;
  id_produto: string | null;
  nome: string;
  codigo: string | null;
  preco: number;
  tipo: string | null;
  situacao: string | null;
  formato: string | null;
  descricaoCurta: string | null;
  unidade: string | null;
  tipoProduto: string | null;
  condicao: number | null;
  marca: string | null;
  categoria_id: number | null;
  fornecedor_id: number | null;
  fornecedor_nome: string | null;
  fornecedor_codigo: string | null;
  fornecedor_precoCusto: number | null;
  ncm: string | null;
  temVariacoes: boolean;
  quantidade_estoque: number;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateProdutoDTO {
  id_bling?: string;
  id_produto?: string;
  nome?: string;
  codigo?: string;
  preco?: number;
  tipo?: string;
  situacao?: string;
  formato?: string;
  descricaoCurta?: string;
  unidade?: string;
  tipoProduto?: string;
  condicao?: number;
  marca?: string;
  categoria_id?: number;
  fornecedor_id?: number;
  fornecedor_nome?: string;
  fornecedor_codigo?: string;
  fornecedor_precoCusto?: number;
  ncm?: string;
  temVariacoes?: boolean;
  quantidade_estoque?: number;
  ativo?: boolean;
}
