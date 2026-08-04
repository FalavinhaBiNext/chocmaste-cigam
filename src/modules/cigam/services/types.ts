export interface CigamMaterialResponse {
  Material: {
    Codigo: string;
    Descricao: string;
    CodigoUnidadeMedida: string;
  };
}

export interface CigamPessoaResponse {
  Codigo: string;
  NomeCompleto: string;
  Fantasia?: string;
  CnpjCpf?: string;
  Endereco?: string;
  Numero?: string;
  Bairro?: string;
  Cidade?: {
    NomeMunicipio?: string;
    UF?: string;
  };
  Uf?: string;
  Telefone?: string;
  Ativo: boolean;
  Divisao?: string;
}

export interface CigamCondicaoPagamentoResponse {
  Codigo: string;
  Descricao: string;
  Forma?: string;
  Ativo: boolean;
}

// --- CIGAM Integrador (CadastroMateriais.integrador) ---

export interface CigamIntegradorMaterialPayload {
  pin: string;
  statusRegistro: 'L' | 'P';
  codigoGrupo: string;
  codigoSubGrupo: string;
  codigoMaterial: string;
  descricao: string;
  tipo: string;
  codigoUnidadeMedida: string;
  utilizaGrade: string;
  grade?: string;
}

export interface CigamIntegradorResponse {
  sucesso: boolean;
  mensagem?: string;
  codigo?: string;
}

export interface CigamIntegradorMaterialListItem {
  Codigo: string;
  Descricao: string;
  CodigoGrupo: string;
  CodigoSubGrupo: string;
  CodigoUnidadeMedida: string;
  Tipo: string;
}
