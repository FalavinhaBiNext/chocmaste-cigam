import { injectable } from 'tsyringe';
import { ProdutoModel } from "../models/produtoModel";
import { IProdutoRepository } from "../interfaces/IProdutoRepository";
import { ResponseProdutoDTO, UpdateProdutoDTO } from "../dto";
import { CreateProdutoInput } from "../produto.validator";
import { ProdutoMapper } from "../mappers/ProdutoMapper";

@injectable()
export class ProdutoRepository implements IProdutoRepository {
  async create(data: CreateProdutoInput): Promise<ResponseProdutoDTO> {
    const produto = await ProdutoModel.create({
      id_bling: data.id_bling,
      id_produto: data.id_produto,
      nome: data.nome,
      codigo: data.codigo,
      preco: data.preco,
      tipo: data.tipo,
      situacao: data.situacao,
      formato: data.formato,
      descricaoCurta: data.descricaoCurta,
      unidade: data.unidade,
      tipoProduto: data.tipoProduto,
      condicao: data.condicao,
      marca: data.marca,
      categoria_id: data.categoria_id,
      fornecedor_id: data.fornecedor_id,
      fornecedor_nome: data.fornecedor_nome,
      fornecedor_codigo: data.fornecedor_codigo,
      fornecedor_precoCusto: data.fornecedor_precoCusto,
      ncm: data.ncm,
      temVariacoes: data.temVariacoes ?? false,
      quantidade_estoque: data.quantidade_estoque ?? 0,
      ativo: data.ativo ?? true,
      unidade_negocio: data.unidade_negocio,
    });

    return ProdutoMapper.produtoToDTO(produto);
  }

  async findAll(): Promise<ResponseProdutoDTO[]> {
    const produtos = await ProdutoModel.findAll();

    if (produtos.length === 0) {
      return [];
    }

    return produtos.map(ProdutoMapper.produtoToDTO);
  }

  async findById(id: string): Promise<ResponseProdutoDTO | null> {
    const produto = await ProdutoModel.findByPk(id);

    if (!produto) {
      return null;
    }

    return ProdutoMapper.produtoToDTO(produto);
  }

  async findByIdBling(idBling: string): Promise<ResponseProdutoDTO | null> {
    const produto = await ProdutoModel.findOne({
      where: { id_bling: idBling }
    });

    if (!produto) {
      return null;
    }

    return ProdutoMapper.produtoToDTO(produto);
  }

  async findByIdProduto(idProduto: string): Promise<ResponseProdutoDTO | null> {
    const produto = await ProdutoModel.findOne({
      where: { id_produto: idProduto }
    });

    if (!produto) {
      return null;
    }

    return ProdutoMapper.produtoToDTO(produto);
  }

  async update(id: string, data: UpdateProdutoDTO): Promise<ResponseProdutoDTO | null> {
    const produto = await ProdutoModel.findByPk(id);

    if (!produto) {
      return null;
    }

    await produto.update(data);

    return ProdutoMapper.produtoToDTO(produto);
  }

  async delete(id: string): Promise<void> {
    await ProdutoModel.destroy({
      where: { id }
    });
  }
}
