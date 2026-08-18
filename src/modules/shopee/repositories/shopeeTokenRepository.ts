import { injectable } from 'tsyringe';
import { ShopeeTokenModel } from '../models/shopeeTokenModel';
import { CreateShopeeTokenDTO, ResponseShopeeTokenDTO } from '../dto';

@injectable()
export class ShopeeTokenRepository {
  async create(data: CreateShopeeTokenDTO): Promise<ResponseShopeeTokenDTO> {
    const token = await ShopeeTokenModel.create({
      shop_id: data.shop_id,
      shop_name: data.shop_name,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      region: data.region,
    });

    return this.toDTO(token);
  }

  async findAll(): Promise<ResponseShopeeTokenDTO[]> {
    const tokens = await ShopeeTokenModel.findAll({
      order: [['created_at', 'DESC']],
    });
    return tokens.map(t => this.toDTO(t));
  }

  async findByShopId(shopId: string): Promise<ResponseShopeeTokenDTO | null> {
    const token = await ShopeeTokenModel.findOne({
      where: { shop_id: shopId },
    });
    if (!token) return null;
    return this.toDTO(token);
  }

  async findActive(): Promise<ShopeeTokenModel | null> {
    return ShopeeTokenModel.findOne({
      where: { active: true },
    });
  }

  async updateToken(shopId: string, data: Partial<CreateShopeeTokenDTO>): Promise<void> {
    await ShopeeTokenModel.update(
      {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
      },
      { where: { shop_id: shopId } }
    );
  }

  async setActive(shopId: string): Promise<void> {
    await ShopeeTokenModel.update({ active: false }, { where: {} });
    await ShopeeTokenModel.update({ active: true }, { where: { shop_id: shopId } });
  }

  async deactivateAll(): Promise<void> {
    await ShopeeTokenModel.update({ active: false }, { where: {} });
  }

  async deleteById(id: string): Promise<void> {
    await ShopeeTokenModel.destroy({ where: { id } });
  }

  private toDTO(model: ShopeeTokenModel): ResponseShopeeTokenDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      shop_id: data.shop_id,
      shop_name: data.shop_name,
      active: data.active,
      region: data.region,
      expires_at: data.expires_at,
      created_at: data.created_at,
    };
  }
}
