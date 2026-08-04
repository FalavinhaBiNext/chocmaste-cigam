import { ResponseClientesCigamDTO } from "../dto";

export class ClientesCigamMapper {
  static clientesCigamToDTO(model: any): ResponseClientesCigamDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      id_cigam: data.id_cigam,
      nome: data.nome,
      documento: data.documento ?? null,
      tipo_pessoa: data.tipo_pessoa ?? null,
      telefone: data.telefone ?? null,
      celular: data.celular ?? null,
      email: data.email ?? null,
      endereco: data.endereco ?? null,
      numero: data.numero ?? null,
      complemento: data.complemento ?? null,
      bairro: data.bairro ?? null,
      cidade: data.cidade ?? null,
      uf: data.uf ?? null,
      cep: data.cep ?? null,
      ativo: data.ativo,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  }
}
