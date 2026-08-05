import { injectable } from 'tsyringe';
import { UsuarioModel } from "../models/usuarioModel";
import { IUsuarioRepository } from "../interfaces/IUsuarioRepository";
import { CreateUsuarioDTO, ResponseUsuarioDTO } from "../dto";
import { UsuarioMapper } from "../mappers/usuarioMapper";

@injectable()
export class UsuarioRepository implements IUsuarioRepository {
    async create(data: CreateUsuarioDTO & { senha: string }): Promise<ResponseUsuarioDTO> {
        const user = await UsuarioModel.create({
            nome: data.nome,
            email: data.email,
            senha: data.senha,
            role: data.role || 'usuario',
            ativo: true
        });
        return UsuarioMapper.toDTO(user);
    }

    async findByEmail(email: string): Promise<(ResponseUsuarioDTO & { senha: string }) | null> {
        const user = await UsuarioModel.findOne({ where: { email } });
        if (!user) return null;
        const dto = UsuarioMapper.toDTO(user);
        return { ...dto, senha: user.senha };
    }

    async findById(id: string): Promise<ResponseUsuarioDTO | null> {
        const user = await UsuarioModel.findByPk(id);
        if (!user) return null;
        return UsuarioMapper.toDTO(user);
    }
}
