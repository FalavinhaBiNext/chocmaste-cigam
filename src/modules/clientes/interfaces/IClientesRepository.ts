import { CreateClientesInput } from "../clientes.validator";
import { ResponseClientesDTO, UpdateClientesDTO } from "../dto";

export interface IClientesRepository {
  create(data: CreateClientesInput): Promise<ResponseClientesDTO>;
  findAll(): Promise<ResponseClientesDTO[]>;
  findById(id: string): Promise<ResponseClientesDTO | null>;
  findByIdBling(idBling: string): Promise<ResponseClientesDTO | null>;
  update(id: string, data: UpdateClientesDTO): Promise<ResponseClientesDTO | null>;
  delete(id: string): Promise<void>;
}
