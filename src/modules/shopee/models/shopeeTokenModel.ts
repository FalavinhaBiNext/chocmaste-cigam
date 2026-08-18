import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class ShopeeTokenModel extends Model {
  public id!: string;
  public shop_id!: string;
  public shop_name!: string | null;
  public access_token!: string;
  public refresh_token!: string;
  public expires_at!: Date | null;
  public region!: string | null;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ShopeeTokenModel.init({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  shop_id: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  shop_name: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  access_token: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  refresh_token: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  expires_at: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  region: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: 'BR',
  },
  active: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'shopee_tokens',
  modelName: 'shopee_tokens',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
