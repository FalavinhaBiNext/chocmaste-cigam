import { ResponseCanalVendaDTO } from "../dto";

export class CanalVendaMapper {
  static canalVendaToDTO(model: any): ResponseCanalVendaDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      id_bling: data.id_bling,
      descricao: data.descricao,
      tipo: data.tipo,
      situacao: data.situacao,
      ativo: data.ativo,
      local_venda: data.local_venda,
      codigo_conta: data.codigo_conta,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }
}
