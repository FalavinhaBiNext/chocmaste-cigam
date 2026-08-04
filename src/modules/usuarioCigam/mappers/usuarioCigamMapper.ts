import { ResponseUsuarioCigamDTO } from "../dto";

export class UsuarioCigamMapper {
    static usuarioCigamToDTO(model: any): ResponseUsuarioCigamDTO {
        const usuarioCigamModel = model.get({ plain: true});

        return {
            id: usuarioCigamModel.id,
            ambiente: usuarioCigamModel.ambiente,
            login: usuarioCigamModel.login,
            senha: usuarioCigamModel.senha,
            url_ambiente: usuarioCigamModel.url_ambiente,
            ativo: usuarioCigamModel.ativo,
            created_at: usuarioCigamModel.created_at
        }
    }
}