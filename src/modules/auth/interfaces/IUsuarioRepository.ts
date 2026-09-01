import { CreateUsuarioDTO, ResponseUsuarioDTO } from "../dto";

export interface IUsuarioRepository {
    create(data: CreateUsuarioDTO & { senha: string }): Promise<ResponseUsuarioDTO>;
    findByEmail(email: string): Promise<(ResponseUsuarioDTO & { senha: string }) | null>;
    findById(id: string): Promise<ResponseUsuarioDTO | null>;
    findAll(): Promise<ResponseUsuarioDTO[]>;
}
