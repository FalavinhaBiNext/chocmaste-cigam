import { CreateFormasPagamentoCigamInput } from "../formasPagamentoCigam.validator";
import { ResponseFormasPagamentoCigamDTO, UpdateFormasPagamentoCigamDTO } from "../dto";

export interface IFormasPagamentoCigamRepository {
  create(data: CreateFormasPagamentoCigamInput): Promise<ResponseFormasPagamentoCigamDTO>;
  findAll(): Promise<ResponseFormasPagamentoCigamDTO[]>;
  findById(id: string): Promise<ResponseFormasPagamentoCigamDTO | null>;
  findByIdCigam(idCigam: string): Promise<ResponseFormasPagamentoCigamDTO | null>;
  update(id: string, data: UpdateFormasPagamentoCigamDTO): Promise<ResponseFormasPagamentoCigamDTO | null>;
  delete(id: string): Promise<void>;
}
