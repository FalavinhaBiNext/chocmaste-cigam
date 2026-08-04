import { ResponsePedidoProdutoDTO } from "../dto";

export class PedidoProdutoMapper {
  static pedidoProdutoToDTO(model: any): ResponsePedidoProdutoDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      id_pedido: data.id_pedido,
      id_produto: data.id_produto,
      quantidade: data.quantidade,
      preco: Number(data.preco),
      total: Number(data.total),
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }
}
