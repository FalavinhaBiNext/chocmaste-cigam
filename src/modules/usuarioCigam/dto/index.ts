export interface CreateUsuarioCigamDTO {
    ambiente: string,
    login: string,
    senha: string,
    url_ambiente: string,
}

export interface ResponseUsuarioCigamDTO {
    id: string,
    ambiente: string,
    login: string,
    senha: string,
    url_ambiente: string,
    ativo: boolean,
    created_at: Date
}