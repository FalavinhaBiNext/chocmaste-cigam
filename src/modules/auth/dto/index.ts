export interface CreateUsuarioDTO {
    nome: string;
    email: string;
    senha: string;
    role?: string;
}

export interface ResponseUsuarioDTO {
    id: string;
    nome: string;
    email: string;
    role: string;
    ativo: boolean;
    created_at: Date;
}

export interface LoginDTO {
    email: string;
    senha: string;
}
