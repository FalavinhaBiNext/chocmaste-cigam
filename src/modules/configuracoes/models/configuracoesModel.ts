import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class ConfiguracoesModel extends Model {
  public id!: string;
  public chave!: string;
  public valor!: string;
  public descricao!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ConfiguracoesModel.init({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  chave: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  valor: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  descricao: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'configuracoes',
  modelName: 'configuracoes',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
