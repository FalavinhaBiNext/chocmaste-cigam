import { ResponseFormaPagamentoDTO } from "../dto";

export class FormaPagamentoMapper {
  static formaPagamentoToDTO(model: any): ResponseFormaPagamentoDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      id_bling: data.id_bling,
      descricao: data.descricao,
      tipo: data.tipo,
      active: data.active,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }
}
