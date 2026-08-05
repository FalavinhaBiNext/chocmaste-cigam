import { ResponseUsuarioDTO } from "../dto";

export class UsuarioMapper {
    static toDTO(model: any): ResponseUsuarioDTO {
        const data = model.get({ plain: true });
        return {
            id: data.id,
            nome: data.nome,
            email: data.email,
            role: data.role,
            ativo: data.ativo,
            created_at: data.created_at
        }
    }
}
