import { ResponseFormasPagamentoCigamDTO } from "../dto";

export class FormasPagamentoCigamMapper {
  static formasPagamentoCigamToDTO(model: any): ResponseFormasPagamentoCigamDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      id_cigam: data.id_cigam,
      descricao: data.descricao,
      tipo: data.tipo ?? null,
      ativo: data.ativo,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  }
}
