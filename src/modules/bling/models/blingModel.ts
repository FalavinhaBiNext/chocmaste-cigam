import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class BlingModel extends Model {
  public id!: string;
  public access_token!: string;
  public refresh_token!: string;
  public expires_at!: Date | null;
  public scope!: string | null;
  public token_type!: string | null;
  public access_token_url!: string;
  public client_id!: string;
  public client_secret!: string;
  public active!: boolean;
  public nome_unidade!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

BlingModel.init({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  access_token: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  refresh_token: {
    type: Sequelize.STRING,
    allowNull: false
  },
  expires_at: {
    type: Sequelize.DATE,
    allowNull: true
  },
  scope: {
    type: Sequelize.STRING,
    allowNull: true
  },
  token_type: {
    type: Sequelize.STRING,
    allowNull: true
  },
  access_token_url: {
    type: Sequelize.STRING,
    allowNull: false
  },
  client_id: {
    type: Sequelize.STRING,
    allowNull: false
  },
  client_secret: {
    type: Sequelize.STRING,
    allowNull: false
  },
  active: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  nome_unidade: {
    type: Sequelize.STRING,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'bling',
  modelName: 'bling',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
