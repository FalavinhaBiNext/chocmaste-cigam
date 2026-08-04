import { CreateProdutosCigamInput } from "../produtosCigam.validator";
import { ResponseProdutosCigamDTO, UpdateProdutosCigamDTO } from "../dto";

export interface IProdutosCigamRepository {
  create(data: CreateProdutosCigamInput): Promise<ResponseProdutosCigamDTO>;
  findAll(): Promise<ResponseProdutosCigamDTO[]>;
  findById(id: string): Promise<ResponseProdutosCigamDTO | null>;
  findByIdCigam(idCigam: string): Promise<ResponseProdutosCigamDTO | null>;
  update(id: string, data: UpdateProdutosCigamDTO): Promise<ResponseProdutosCigamDTO | null>;
  delete(id: string): Promise<void>;
}
