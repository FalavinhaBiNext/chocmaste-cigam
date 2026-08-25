import { injectable } from 'tsyringe';
import { TrayTokenModel } from '../models/trayTokenModel';
import { TrayTokenDTO } from '../dto';

@injectable()
export class TrayTokenRepository {
  async findActive(): Promise<TrayTokenDTO | null> {
    const token = await TrayTokenModel.findOne({
      where: { active: true },
      order: [['created_at', 'DESC']],
    });
    if (!token) return null;
    return this.toDTO(token);
  }

  async findById(id: string): Promise<TrayTokenDTO | null> {
    const token = await TrayTokenModel.findByPk(id);
    if (!token) return null;
    return this.toDTO(token);
  }

  async findByStoreId(storeId: string): Promise<TrayTokenDTO | null> {
    const token = await TrayTokenModel.findOne({
      where: { store_id: storeId },
    });
    if (!token) return null;
    return this.toDTO(token);
  }

  async findAll(): Promise<TrayTokenDTO[]> {
    const tokens = await TrayTokenModel.findAll({
      order: [['created_at', 'DESC']],
    });
    return tokens.map(t => this.toDTO(t));
  }

  async save(data: {
    store_id: string;
    api_address: string;
    consumer_key: string;
    access_token: string;
    refresh_token: string;
    date_expiration_access_token: Date;
    date_expiration_refresh_token: Date;
    date_activated?: Date | null;
  }): Promise<TrayTokenDTO> {
    const existing = await this.findByStoreId(data.store_id);
    if (existing) {
      await TrayTokenModel.update(
        {
          api_address: data.api_address,
          consumer_key: data.consumer_key,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          date_expiration_access_token: data.date_expiration_access_token,
          date_expiration_refresh_token: data.date_expiration_refresh_token,
          date_activated: data.date_activated,
        },
        { where: { store_id: data.store_id } },
      );
      const updated = await this.findByStoreId(data.store_id);
      return updated!;
    }

    const token = await TrayTokenModel.create(data);
    return this.toDTO(token);
  }

  async updateTokens(id: string, data: {
    access_token: string;
    refresh_token: string;
    date_expiration_access_token: Date;
    date_expiration_refresh_token: Date;
  }): Promise<void> {
    await TrayTokenModel.update(data, { where: { id } });
  }

  async deactivateAll(): Promise<void> {
    await TrayTokenModel.update({ active: false }, { where: { active: true } });
  }

  async setActive(storeId: string): Promise<void> {
    await this.deactivateAll();
    await TrayTokenModel.update({ active: true }, { where: { store_id: storeId } });
  }

  async deleteById(id: string): Promise<void> {
    await TrayTokenModel.destroy({ where: { id } });
  }

  private toDTO(model: TrayTokenModel): TrayTokenDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      store_id: data.store_id,
      api_address: data.api_address,
      consumer_key: data.consumer_key,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      date_expiration_access_token: data.date_expiration_access_token,
      date_expiration_refresh_token: data.date_expiration_refresh_token,
      date_activated: data.date_activated,
      active: data.active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
