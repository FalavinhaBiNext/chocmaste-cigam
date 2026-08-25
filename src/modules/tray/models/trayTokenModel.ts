import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class TrayTokenModel extends Model {
  public id!: string;
  public store_id!: string;
  public api_address!: string;
  public consumer_key!: string;
  public access_token!: string;
  public refresh_token!: string;
  public date_expiration_access_token!: Date;
  public date_expiration_refresh_token!: Date;
  public date_activated!: Date | null;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

TrayTokenModel.init({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  store_id: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  api_address: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  consumer_key: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  access_token: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  refresh_token: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  date_expiration_access_token: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  date_expiration_refresh_token: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  date_activated: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  active: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'tray_tokens',
  modelName: 'tray_tokens',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
