import { CreateProdutoInput } from "../produto.validator";
import { ResponseProdutoDTO, UpdateProdutoDTO } from "../dto";

export interface IProdutoRepository {
  create(data: CreateProdutoInput): Promise<ResponseProdutoDTO>;
  findAll(): Promise<ResponseProdutoDTO[]>;
  findById(id: string): Promise<ResponseProdutoDTO | null>;
  findByIdBling(idBling: string): Promise<ResponseProdutoDTO | null>;
  findByIdProduto(idProduto: string): Promise<ResponseProdutoDTO | null>;
  update(id: string, data: UpdateProdutoDTO): Promise<ResponseProdutoDTO | null>;
  delete(id: string): Promise<void>;
}
