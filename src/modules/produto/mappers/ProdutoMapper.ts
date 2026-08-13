import { ResponseProdutoDTO } from "../dto";

export class ProdutoMapper {
  static produtoToDTO(model: any): ResponseProdutoDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      id_bling: data.id_bling,
      id_produto: data.id_produto,
      nome: data.nome,
      codigo: data.codigo,
      preco: Number(data.preco),
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
      fornecedor_precoCusto: data.fornecedor_precoCusto ? Number(data.fornecedor_precoCusto) : null,
      ncm: data.ncm,
      temVariacoes: data.temVariacoes,
      quantidade_estoque: data.quantidade_estoque,
      ativo: data.ativo,
      unidade_negocio: data.unidade_negocio,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }
}
