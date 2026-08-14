import { injectable } from 'tsyringe';
import { BlingModel } from "../models/blingModel";
import { IBlingTokenRepository } from "../interfaces/IBlingTokenRepository";
import { CreateBlingTokenDTO, ResponseBlingTokenDTO, UpdateBlingTokenDTO } from "../dto";
import { BlingMapper } from "../mappers/BlingMapper";
import { NotFoundError } from "@/shared/errors/AppError";

@injectable()
export class BlingRepository implements IBlingTokenRepository {
  async findActive(): Promise<ResponseBlingTokenDTO | null> {
    const token = await BlingModel.findOne({
      where: { active: true },
      order: [['created_at', 'DESC']],
    });
    if (!token) return null;
    return BlingMapper.tokenToDTO(token);
  }

  async findAll(): Promise<ResponseBlingTokenDTO[]> {
    const tokens = await BlingModel.findAll({
      order: [['created_at', 'DESC']],
    });
    return tokens.map(BlingMapper.tokenToDTO);
  }

  async findByNomeUnidade(nomeUnidade: string): Promise<ResponseBlingTokenDTO | null> {
    const token = await BlingModel.findOne({
      where: { nome_unidade: nomeUnidade, active: true },
    });
    if (!token) return null;
    return BlingMapper.tokenToDTO(token);
  }

  async findByCompanyIdBling(companyIdBling: string): Promise<ResponseBlingTokenDTO | null> {
    const token = await BlingModel.findOne({
      where: { company_id_bling: companyIdBling, active: true },
    });
    if (!token) return null;
    return BlingMapper.tokenToDTO(token);
  }

  async deactivateAll(): Promise<void> {
    await BlingModel.update({ active: false }, { where: { active: true } });
  }

  async findById(id: string): Promise<ResponseBlingTokenDTO | null> {
    const token = await BlingModel.findByPk(id);
    if (!token) return null;
    return BlingMapper.tokenToDTO(token);
  }

  async save(data: CreateBlingTokenDTO): Promise<ResponseBlingTokenDTO> {
    const token = await BlingModel.create({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      scope: data.scope,
      token_type: data.token_type,
      access_token_url: data.access_token_url || process.env.BLING_ACCESS_TOKEN_URL || 'https://www.bling.com.br/Api/v3/oauth/token',
      client_id: data.client_id || process.env.BLING_CLIENT_ID!,
      client_secret: data.client_secret || process.env.BLING_CLIENT_SECRET!,
      active: data.active !== undefined ? data.active : true,
      nome_unidade: data.nome_unidade,
      company_id_bling: data.company_id_bling
    });
    return BlingMapper.tokenToDTO(token);
  }

  async update(id: string, data: UpdateBlingTokenDTO): Promise<ResponseBlingTokenDTO> {
    const token = await BlingModel.findByPk(id);
    if (!token) {
      throw new NotFoundError(`Token Bling ${id} não encontrado`);
    }
    await token.update(data);
    return BlingMapper.tokenToDTO(token);
  }
}
