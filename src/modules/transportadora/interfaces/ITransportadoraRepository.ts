import { CreateTransportadoraInput } from "../transportadora.validator";
import { ResponseTransportadoraDTO, UpdateTransportadoraDTO } from "../dto";

export interface ITransportadoraRepository {
  create(data: CreateTransportadoraInput): Promise<ResponseTransportadoraDTO>;
  findAll(): Promise<ResponseTransportadoraDTO[]>;
  findById(id: string): Promise<ResponseTransportadoraDTO | null>;
  findByIdBling(idBling: string): Promise<ResponseTransportadoraDTO | null>;
  update(id: string, data: UpdateTransportadoraDTO): Promise<ResponseTransportadoraDTO | null>;
  delete(id: string): Promise<void>;
}
