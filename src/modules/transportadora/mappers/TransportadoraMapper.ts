import { ResponseTransportadoraDTO } from "../dto";

export class TransportadoraMapper {
  static transportadoraToDTO(model: any): ResponseTransportadoraDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      id_bling: data.id_bling,
      nome: data.nome,
      fantasia: data.fantasia,
      documento: data.documento,
      active: data.active,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }
}