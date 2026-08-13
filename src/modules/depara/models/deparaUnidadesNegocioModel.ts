import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class DeParaUnidadesNegocioModel extends Model {
  public id!: string;
  public company_id_bling!: string;
  public unidade_negocio!: string;
  public nome!: string;
  public ativo!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

DeParaUnidadesNegocioModel.init({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  company_id_bling: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  unidade_negocio: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  nome: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  ativo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'de_para_unidades_negocio',
  modelName: 'de_para_unidades_negocio',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
