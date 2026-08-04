import { CreateFormaPagamentoInput } from "../formaPagamento.validator";
import { ResponseFormaPagamentoDTO, UpdateFormaPagamentoDTO } from "../dto";

export interface IFormaPagamentoRepository {
  create(data: CreateFormaPagamentoInput): Promise<ResponseFormaPagamentoDTO>;
  findAll(): Promise<ResponseFormaPagamentoDTO[]>;
  findById(id: string): Promise<ResponseFormaPagamentoDTO | null>;
  findByIdBling(idBling: string): Promise<ResponseFormaPagamentoDTO | null>;
  update(id: string, data: UpdateFormaPagamentoDTO): Promise<ResponseFormaPagamentoDTO | null>;
  delete(id: string): Promise<void>;
}
