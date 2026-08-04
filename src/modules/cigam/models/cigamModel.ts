import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class CigamModel extends Model {
  public id!: string;
  public hash!: string;
  public ambiente!: string;
  public expires_at!: Date | null;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CigamModel.init({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  hash: {
    type: Sequelize.STRING(512),
    allowNull: false
  },
  ambiente: {
    type: Sequelize.STRING,
    allowNull: false
  },
  expires_at: {
    type: Sequelize.DATE,
    allowNull: true
  },
  active: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  sequelize,
  tableName: 'cigam_tokens',
  modelName: 'cigam',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})