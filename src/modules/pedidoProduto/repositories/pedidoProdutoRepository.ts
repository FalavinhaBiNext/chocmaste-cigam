import { injectable } from 'tsyringe';
import { PedidoProdutoModel } from "../models/pedidoProdutoModel";
import { IPedidoProdutoRepository } from "../interfaces/IPedidoProdutoRepository";
import { ResponsePedidoProdutoDTO, UpdatePedidoProdutoDTO } from "../dto";
import { CreatePedidoProdutoInput } from "../pedidoProduto.validator";
import { PedidoProdutoMapper } from "../mappers/PedidoProdutoMapper";

@injectable()
export class PedidoProdutoRepository implements IPedidoProdutoRepository {
  async create(data: CreatePedidoProdutoInput): Promise<ResponsePedidoProdutoDTO> {
    const pedidoProduto = await PedidoProdutoModel.create({
      id_pedido: data.id_pedido,
      id_produto: data.id_produto,
      quantidade: data.quantidade,
      preco: data.preco,
      total: data.total,
    });

    return PedidoProdutoMapper.pedidoProdutoToDTO(pedidoProduto);
  }

  async findAll(): Promise<ResponsePedidoProdutoDTO[]> {
    const pedidoProdutos = await PedidoProdutoModel.findAll();

    if (pedidoProdutos.length === 0) {
      return [];
    }

    return pedidoProdutos.map(PedidoProdutoMapper.pedidoProdutoToDTO);
  }

  async findById(id: string): Promise<ResponsePedidoProdutoDTO | null> {
    const pedidoProduto = await PedidoProdutoModel.findByPk(id);

    if (!pedidoProduto) {
      return null;
    }

    return PedidoProdutoMapper.pedidoProdutoToDTO(pedidoProduto);
  }

  async findByIdPedido(idPedido: string): Promise<ResponsePedidoProdutoDTO[]> {
    const pedidoProdutos = await PedidoProdutoModel.findAll({
      where: { id_pedido: idPedido }
    });

    return pedidoProdutos.map(PedidoProdutoMapper.pedidoProdutoToDTO);
  }

  async findByIdProduto(idProduto: string): Promise<ResponsePedidoProdutoDTO[]> {
    const pedidoProdutos = await PedidoProdutoModel.findAll({
      where: { id_produto: idProduto }
    });

    return pedidoProdutos.map(PedidoProdutoMapper.pedidoProdutoToDTO);
  }

  async update(id: string, data: UpdatePedidoProdutoDTO): Promise<ResponsePedidoProdutoDTO | null> {
    const pedidoProduto = await PedidoProdutoModel.findByPk(id);

    if (!pedidoProduto) {
      return null;
    }

    await pedidoProduto.update(data);

    return PedidoProdutoMapper.pedidoProdutoToDTO(pedidoProduto);
  }

  async delete(id: string): Promise<void> {
    await PedidoProdutoModel.destroy({
      where: { id }
    });
  }

  async deleteByIdPedido(idPedido: string): Promise<void> {
    await PedidoProdutoModel.destroy({
      where: { id_pedido: idPedido }
    });
  }
}
