import { CreateClientesCigamInput } from "../clientesCigam.validator";
import { ResponseClientesCigamDTO, UpdateClientesCigamDTO } from "../dto";

export interface IClientesCigamRepository {
  create(data: CreateClientesCigamInput): Promise<ResponseClientesCigamDTO>;
  findAll(): Promise<ResponseClientesCigamDTO[]>;
  findById(id: string): Promise<ResponseClientesCigamDTO | null>;
  findByIdCigam(idCigam: string): Promise<ResponseClientesCigamDTO | null>;
  update(id: string, data: UpdateClientesCigamDTO): Promise<ResponseClientesCigamDTO | null>;
  delete(id: string): Promise<void>;
}
