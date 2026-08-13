import { injectable } from 'tsyringe';
import { MercadoLivreTokenModel } from '../models/mercadoLivreTokenModel';
import { MercadoLivreTokenDTO } from '../dto';

@injectable()
export class MercadoLivreTokenRepository {
  async findActive(): Promise<MercadoLivreTokenDTO | null> {
    const token = await MercadoLivreTokenModel.findOne({
      where: { active: true },
      order: [['created_at', 'DESC']],
    });
    if (!token) return null;
    return this.toDTO(token);
  }

  async findByUserId(userId: string): Promise<MercadoLivreTokenDTO | null> {
    const token = await MercadoLivreTokenModel.findOne({
      where: { user_id_ml: userId },
    });
    if (!token) return null;
    return this.toDTO(token);
  }

  async findAll(): Promise<MercadoLivreTokenDTO[]> {
    const tokens = await MercadoLivreTokenModel.findAll({
      order: [['created_at', 'DESC']],
    });
    return tokens.map(t => this.toDTO(t));
  }

  async save(data: {
    user_id_ml: string;
    access_token: string;
    refresh_token: string;
    expires_at: Date;
    scope?: string;
    token_type?: string;
    app_id: string;
    nickname?: string;
  }): Promise<MercadoLivreTokenDTO> {
    const existing = await this.findByUserId(data.user_id_ml);
    if (existing) {
      await MercadoLivreTokenModel.update(
        {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
          scope: data.scope,
          token_type: data.token_type,
          nickname: data.nickname,
        },
        { where: { user_id_ml: data.user_id_ml } }
      );
      const updated = await this.findByUserId(data.user_id_ml);
      return updated!;
    }

    const token = await MercadoLivreTokenModel.create(data);
    return this.toDTO(token);
  }

  async deactivateAll(): Promise<void> {
    await MercadoLivreTokenModel.update({ active: false }, { where: { active: true } });
  }

  async setActive(userId: string): Promise<void> {
    await this.deactivateAll();
    await MercadoLivreTokenModel.update({ active: true }, { where: { user_id_ml: userId } });
  }

  async deleteById(id: string): Promise<void> {
    await MercadoLivreTokenModel.destroy({ where: { id } });
  }

  private toDTO(model: MercadoLivreTokenModel): MercadoLivreTokenDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      user_id_ml: data.user_id_ml,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      scope: data.scope,
      token_type: data.token_type,
      app_id: data.app_id,
      nickname: data.nickname,
      active: data.active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
