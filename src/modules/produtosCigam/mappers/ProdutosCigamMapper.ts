import { ResponseProdutosCigamDTO } from "../dto";

export class ProdutosCigamMapper {
  static produtosCigamToDTO(model: any): ResponseProdutosCigamDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      id_cigam: data.id_cigam,
      nome: data.nome,
      preco: Number(data.preco),
      unidade: data.unidade ?? null,
      ncm: data.ncm ?? null,
      quantidade_estoque: data.quantidade_estoque,
      ativo: data.ativo,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  }
}
