import { CreateUsuarioCigamDTO, ResponseUsuarioCigamDTO } from "../dto";

export interface IUsuarioCigamRepository {
    create(data: CreateUsuarioCigamDTO): Promise<ResponseUsuarioCigamDTO>;
    findAll(): Promise<ResponseUsuarioCigamDTO[]>;
    findById(id: string): Promise<ResponseUsuarioCigamDTO | null>
    findByEnv(env: string): Promise<ResponseUsuarioCigamDTO | null>
    update(id: string, data: any): Promise<void>
    delete(id: string): Promise<void>;
    alterAtivo(id: string, ativo: boolean): Promise<void>
}