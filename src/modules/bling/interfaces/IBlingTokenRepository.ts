import { CreateBlingTokenDTO, ResponseBlingTokenDTO, UpdateBlingTokenDTO } from "../dto";

export interface IBlingTokenRepository {
  findActive(): Promise<ResponseBlingTokenDTO | null>;
  findAll(): Promise<ResponseBlingTokenDTO[]>;
  findByNomeUnidade(nomeUnidade: string): Promise<ResponseBlingTokenDTO | null>;
  findById(id: string): Promise<ResponseBlingTokenDTO | null>;
  save(data: CreateBlingTokenDTO): Promise<ResponseBlingTokenDTO>;
  update(id: string, data: UpdateBlingTokenDTO): Promise<ResponseBlingTokenDTO>;
}
