import { injectable } from 'tsyringe';
import { PedidoModel } from "../models/pedidoModel";
import { IPedidoRepository } from "../interfaces/IPedidoRepository";
import { ResponsePedidoDTO, UpdatePedidoDTO } from "../dto";
import { CreatePedidoInput } from "../pedido.validator";
import { PedidoMapper } from "../mappers/PedidoMapper";

@injectable()
export class PedidoRepository implements IPedidoRepository {
  async create(data: CreatePedidoInput): Promise<ResponsePedidoDTO> {
    const pedido = await PedidoModel.create({
      id_bling: data.id_bling,
      codigo_curto: data.codigo_curto,
      numero_loja: data.numero_loja,
      data_pedido: data.data_pedido,
      total_produtos: data.total_produtos,
      total_venda: data.total_venda,
      id_cliente_bling: data.id_cliente_bling,
      nome_cliente: data.nome_cliente,
      documento_cliente: data.documento_cliente,
      tipo_pessoa: data.tipo_pessoa,
      id_loja: data.id_loja,
      desconto: data.desconto,
      quantidade_itens: data.quantidade_itens,
      status_venda: data.status_venda,
      codigo_transportadora: data.codigo_transportadora,
      valor_frete: data.valor_frete,
      nome_transportadora: data.nome_transportadora,
      codigo_rastreio: data.codigo_rastreio,
      unidade_negocio: data.unidade_negocio,
      data_prevista: data.data_prevista,
    });

    return PedidoMapper.pedidoToDTO(pedido);
  }

  async findAll(): Promise<ResponsePedidoDTO[]> {
    const pedidos = await PedidoModel.findAll();

    if (pedidos.length === 0) {
      return [];
    }

    return pedidos.map(PedidoMapper.pedidoToDTO);
  }

  async findById(id: string): Promise<ResponsePedidoDTO | null> {
    const pedido = await PedidoModel.findByPk(id);

    if (!pedido) {
      return null;
    }

    return PedidoMapper.pedidoToDTO(pedido);
  }

  async findByIdBling(idBling: string): Promise<ResponsePedidoDTO | null> {
    const pedido = await PedidoModel.findOne({
      where: { id_bling: idBling }
    });

    if (!pedido) {
      return null;
    }

    return PedidoMapper.pedidoToDTO(pedido);
  }

  async findByNumeroLoja(numeroLoja: string): Promise<ResponsePedidoDTO | null> {
    const pedido = await PedidoModel.findOne({
      where: { numero_loja: numeroLoja }
    });

    if (!pedido) {
      return null;
    }

    return PedidoMapper.pedidoToDTO(pedido);
  }

  async findByNumeroPedidoCigam(numeroPedidoCigam: string): Promise<ResponsePedidoDTO | null> {
    const pedido = await PedidoModel.findOne({
      where: { numero_pedido_cigam: numeroPedidoCigam }
    });

    if (!pedido) {
      return null;
    }

    return PedidoMapper.pedidoToDTO(pedido);
  }

  async update(id: string, data: UpdatePedidoDTO): Promise<ResponsePedidoDTO | null> {
    const pedido = await PedidoModel.findByPk(id);

    if (!pedido) {
      return null;
    }

    await pedido.update(data);

    return PedidoMapper.pedidoToDTO(pedido);
  }

  async delete(id: string): Promise<void> {
    await PedidoModel.destroy({
      where: { id }
    });
  }
}
