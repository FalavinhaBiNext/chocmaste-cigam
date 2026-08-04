import { injectable } from 'tsyringe';
import { CreateUsuarioCigamDTO, ResponseUsuarioCigamDTO } from "../dto";
import { UsuarioCigamModel } from "../models/usuarioCigamModel";
import { IUsuarioCigamRepository } from "../interfaces/IUsuarioCigamRepository";
import { UsuarioCigamMapper } from "../mappers/usuarioCigamMapper";

@injectable()
export class UsuarioCigamRepository implements IUsuarioCigamRepository {
    async create(data: CreateUsuarioCigamDTO): Promise<ResponseUsuarioCigamDTO> {
        const usuarioCigam = await UsuarioCigamModel.create({
            ambiente: data.ambiente,
            login: data.login,
            senha: data.senha,
            url_ambiente: data.url_ambiente
        })

        return UsuarioCigamMapper.usuarioCigamToDTO(usuarioCigam)
    }

    async findAll(): Promise<ResponseUsuarioCigamDTO[]> {
        const usuarioCigam = await UsuarioCigamModel.findAll()

        if(usuarioCigam.length === 0 ){
            return []
        }

        return usuarioCigam.map(UsuarioCigamMapper.usuarioCigamToDTO)
    }

    async findById(id: string): Promise<ResponseUsuarioCigamDTO | null> {
        const usuarioCigam = await UsuarioCigamModel.findByPk(id)

        if( !usuarioCigam ){
            return null
        }

        return UsuarioCigamMapper.usuarioCigamToDTO(usuarioCigam)
    }

    async findByEnv(env: string): Promise<ResponseUsuarioCigamDTO | null> {
        const usuarioCigam = await UsuarioCigamModel.findOne({
            where: {
                ambiente: env
            }
        })

        if( !usuarioCigam ) {
            return null
        }

        return UsuarioCigamMapper.usuarioCigamToDTO(usuarioCigam)
    }

    async update(id: string, data: any): Promise<void> {
        await UsuarioCigamModel.update(data, {
            where: {
                id: id
            }
        })
        return
    }

    async delete(id: string): Promise<void>{
        await UsuarioCigamModel.destroy({
            where: {
                id: id
            }
        })

        return
    }

    async alterAtivo(id: string, ativo: boolean): Promise<void>{
        await UsuarioCigamModel.update({
            ativo: ativo
        }, {
            where: {
                id: id
            }
        })
    }
}