import { ResponseClientesDTO } from "../dto";

export class ClientesMapper {
  static clientesToDTO(model: any): ResponseClientesDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      id_bling: data.id_bling,
      nome: data.nome,
      documento: data.documento,
      telefone: data.telefone,
      celular: data.celular,
      email: data.email,
      endereco: data.endereco,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.cidade,
      uf: data.uf,
      cep: data.cep,
      active: data.active,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }
}
