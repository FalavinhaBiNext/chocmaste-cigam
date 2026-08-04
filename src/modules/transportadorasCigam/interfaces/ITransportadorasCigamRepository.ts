import { CreateTransportadorasCigamInput } from "../transportadorasCigam.validator";
import { ResponseTransportadorasCigamDTO, UpdateTransportadorasCigamDTO } from "../dto";

export interface ITransportadorasCigamRepository {
  create(data: CreateTransportadorasCigamInput): Promise<ResponseTransportadorasCigamDTO>;
  findAll(): Promise<ResponseTransportadorasCigamDTO[]>;
  findById(id: string): Promise<ResponseTransportadorasCigamDTO | null>;
  findByIdCigam(idCigam: string): Promise<ResponseTransportadorasCigamDTO | null>;
  update(id: string, data: UpdateTransportadorasCigamDTO): Promise<ResponseTransportadorasCigamDTO | null>;
  delete(id: string): Promise<void>;
}
