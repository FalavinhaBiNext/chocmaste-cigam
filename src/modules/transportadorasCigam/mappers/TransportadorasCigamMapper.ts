import { ResponseTransportadorasCigamDTO } from "../dto";

export class TransportadorasCigamMapper {
  static transportadorasCigamToDTO(model: any): ResponseTransportadorasCigamDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      id_cigam: data.id_cigam,
      nome: data.nome,
      fantasia: data.fantasia ?? null,
      documento: data.documento ?? null,
      codigo_divisao: data.codigo_divisao,
      ativo: data.ativo,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  }
}
