import { injectable } from 'tsyringe';
import { ProdutosCigamModel } from "../models/produtosCigamModel";
import { IProdutosCigamRepository } from "../interfaces/IProdutosCigamRepository";
import { ResponseProdutosCigamDTO, UpdateProdutosCigamDTO } from "../dto";
import { CreateProdutosCigamInput } from "../produtosCigam.validator";
import { ProdutosCigamMapper } from "../mappers/ProdutosCigamMapper";

@injectable()
export class ProdutosCigamRepository implements IProdutosCigamRepository {
  async create(data: CreateProdutosCigamInput): Promise<ResponseProdutosCigamDTO> {
    const produto = await ProdutosCigamModel.create({
      id_cigam: data.id_cigam,
      nome: data.nome,
      preco: data.preco,
      unidade: data.unidade,
      ncm: data.ncm,
      quantidade_estoque: data.quantidade_estoque ?? 0,
      ativo: data.ativo ?? true,
    });

    return ProdutosCigamMapper.produtosCigamToDTO(produto);
  }

  async findAll(): Promise<ResponseProdutosCigamDTO[]> {
    const produtos = await ProdutosCigamModel.findAll();

    if (produtos.length === 0) {
      return [];
    }

    return produtos.map(ProdutosCigamMapper.produtosCigamToDTO);
  }

  async findById(id: string): Promise<ResponseProdutosCigamDTO | null> {
    const produto = await ProdutosCigamModel.findByPk(id);

    if (!produto) {
      return null;
    }

    return ProdutosCigamMapper.produtosCigamToDTO(produto);
  }

  async findByIdCigam(idCigam: string): Promise<ResponseProdutosCigamDTO | null> {
    const produto = await ProdutosCigamModel.findOne({
      where: { id_cigam: idCigam }
    });

    if (!produto) {
      return null;
    }

    return ProdutosCigamMapper.produtosCigamToDTO(produto);
  }

  async update(id: string, data: UpdateProdutosCigamDTO): Promise<ResponseProdutosCigamDTO | null> {
    const produto = await ProdutosCigamModel.findByPk(id);

    if (!produto) {
      return null;
    }

    await produto.update(data);

    return ProdutosCigamMapper.produtosCigamToDTO(produto);
  }

  async delete(id: string): Promise<void> {
    await ProdutosCigamModel.destroy({
      where: { id }
    });
  }
}
