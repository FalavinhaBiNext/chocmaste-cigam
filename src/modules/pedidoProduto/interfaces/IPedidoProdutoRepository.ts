import { CreatePedidoProdutoInput } from "../pedidoProduto.validator";
import { ResponsePedidoProdutoDTO, UpdatePedidoProdutoDTO } from "../dto";

export interface IPedidoProdutoRepository {
  create(data: CreatePedidoProdutoInput): Promise<ResponsePedidoProdutoDTO>;
  findAll(): Promise<ResponsePedidoProdutoDTO[]>;
  findById(id: string): Promise<ResponsePedidoProdutoDTO | null>;
  findByIdPedido(idPedido: string): Promise<ResponsePedidoProdutoDTO[]>;
  findByIdProduto(idProduto: string): Promise<ResponsePedidoProdutoDTO[]>;
  update(id: string, data: UpdatePedidoProdutoDTO): Promise<ResponsePedidoProdutoDTO | null>;
  delete(id: string): Promise<void>;
}
