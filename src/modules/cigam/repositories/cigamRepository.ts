import { injectable } from 'tsyringe';
import { CigamModel } from "../models/cigamModel";
import { CreateCigamTokenDTO, ResponseCigamTokenDTO, UpdateCigamTokenDTO } from "../dto";
import { CigamMapper } from "../mappers/CigamMapper";
import { NotFoundError } from "@/shared/errors/AppError";

@injectable()
export class CigamRepository {
  async findByAmbiente(ambiente: string): Promise<ResponseCigamTokenDTO | null> {
    const token = await CigamModel.findOne({
      where: {
        ambiente,
        active: true
      }
    });
    if (!token) return null;
    return CigamMapper.tokenToDTO(token);
  }

  async findById(id: string): Promise<ResponseCigamTokenDTO | null> {
    const token = await CigamModel.findByPk(id);
    if (!token) return null;
    return CigamMapper.tokenToDTO(token);
  }

  async save(data: CreateCigamTokenDTO): Promise<ResponseCigamTokenDTO> {
    const token = await CigamModel.create({
      hash: data.hash,
      ambiente: data.ambiente,
      expires_at: data.expires_at,
      active: data.active !== undefined ? data.active : true
    });
    return CigamMapper.tokenToDTO(token);
  }

  async update(id: string, data: UpdateCigamTokenDTO): Promise<ResponseCigamTokenDTO> {
    const token = await CigamModel.findByPk(id);
    if (!token) {
      throw new NotFoundError(`Token Cigam ${id} não encontrado`);
    }
    await token.update(data);
    return CigamMapper.tokenToDTO(token);
  }
}