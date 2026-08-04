export interface CreateCigamTokenDTO {
  hash: string;
  ambiente: string;
  expires_at?: Date;
  active?: boolean;
}

export interface ResponseCigamTokenDTO {
  id: string;
  hash: string;
  ambiente: string;
  expires_at: Date | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateCigamTokenDTO {
  hash?: string;
  expires_at?: Date;
  active?: boolean;
}

export interface CigamAuthResponseDTO {
  hash: string;
  expiresAt?: string;
}

export interface CigamLoginPayload {
  NomeUsuario: string;
  Senha: string;
}

export interface CigamStatusResponse {
  authenticated: boolean;
  ambiente: string | null;
  hash_expira_em: Date | null;
  message: string;
}

export interface SyncResultDTO {
  entity: string;
  created: number;
  updated: number;
  errors: string[];
  total?: number;
}

export interface SyncInput {
  ambiente: string;
}

// --- CIGAM Integrador DTOs ---

export interface CadastrarMaterialIntegradorInput {
  codigoGrupo: string;
  codigoSubGrupo: string;
  codigoMaterial: string;
  descricao: string;
  tipo: string;
  codigoUnidadeMedida: string;
  utilizaGrade: string;
  grade?: string;
}

export interface CadastrarEMapearInput extends CadastrarMaterialIntegradorInput {
  idProdutoLocal?: string;
  nomeProduto: string;
  preco?: number;
}

export interface SincronizacaoResult {
  materiaisEncontrados: number;
  criadosLocais: number;
  mapeamentosCriados: number;
  erros: string[];
}