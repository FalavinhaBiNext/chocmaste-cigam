import { CreatePedidoInput } from "../pedido.validator";
import { ResponsePedidoDTO, UpdatePedidoDTO } from "../dto";

export interface IPedidoRepository {
  create(data: CreatePedidoInput): Promise<ResponsePedidoDTO>;
  findAll(): Promise<ResponsePedidoDTO[]>;
  findById(id: string): Promise<ResponsePedidoDTO | null>;
  findByIdBling(idBling: string): Promise<ResponsePedidoDTO | null>;
  findByNumeroLoja(numeroLoja: string): Promise<ResponsePedidoDTO | null>;
  update(id: string, data: UpdatePedidoDTO): Promise<ResponsePedidoDTO | null>;
  delete(id: string): Promise<void>;
}
