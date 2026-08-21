import { ResponsePedidoDTO } from "../dto";

export class PedidoMapper {
  static pedidoToDTO(model: any): ResponsePedidoDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      id_bling: data.id_bling,
      codigo_curto: data.codigo_curto,
      numero_loja: data.numero_loja,
      data_pedido: data.data_pedido,
      total_produtos: Number(data.total_produtos),
      total_venda: Number(data.total_venda),
      id_cliente_bling: data.id_cliente_bling,
      nome_cliente: data.nome_cliente,
      documento_cliente: data.documento_cliente,
      tipo_pessoa: data.tipo_pessoa,
      id_loja: data.id_loja,
      desconto: Number(data.desconto),
      quantidade_itens: data.quantidade_itens,
      status_venda: data.status_venda,
      codigo_transportadora: data.codigo_transportadora,
      valor_frete: Number(data.valor_frete),
      nome_transportadora: data.nome_transportadora,
      codigo_rastreio: data.codigo_rastreio,
      unidade_negocio: data.unidade_negocio,
      data_prevista: data.data_prevista,
      numero_pedido_cigam: data.numero_pedido_cigam,
      marketplace: data.marketplace,
      status_nfe: data.status_nfe,
      shipping_id: data.shipping_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }
}
