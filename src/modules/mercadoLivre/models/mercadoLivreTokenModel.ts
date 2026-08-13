import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class MercadoLivreTokenModel extends Model {
  public id!: string;
  public user_id_ml!: string;
  public access_token!: string;
  public refresh_token!: string;
  public expires_at!: Date;
  public scope!: string | null;
  public token_type!: string | null;
  public app_id!: string;
  public nickname!: string | null;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

MercadoLivreTokenModel.init({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  user_id_ml: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  access_token: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  refresh_token: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  expires_at: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  scope: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  token_type: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  app_id: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  nickname: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  active: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'mercado_livre_tokens',
  modelName: 'mercado_livre_tokens',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
