import { CreateCanalVendaDTO, ResponseCanalVendaDTO, UpdateCanalVendaDTO } from "../dto";

export interface ICanalVendaRepository {
  create(data: CreateCanalVendaDTO): Promise<ResponseCanalVendaDTO>;
  findAll(): Promise<ResponseCanalVendaDTO[]>;
  findById(id: string): Promise<ResponseCanalVendaDTO | null>;
  findByIdBling(idBling: string): Promise<ResponseCanalVendaDTO | null>;
  update(id: string, data: UpdateCanalVendaDTO): Promise<ResponseCanalVendaDTO | null>;
  delete(id: string): Promise<void>;
}
