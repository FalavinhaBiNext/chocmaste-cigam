import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class TransportadorasCigamModel extends Model {
  public id!: string;
  public id_cigam!: string;
  public id_de_para!: string | null;
  public nome!: string;
  public fantasia!: string | null;
  public documento!: string | null;
  public codigo_divisao!: string;
  public ativo!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

TransportadorasCigamModel.init({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  id_cigam: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  id_de_para: {
    type: Sequelize.UUID,
    allowNull: true,
  },
  nome: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  fantasia: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  documento: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  codigo_divisao: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "70",
  },
  ativo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'transportadoras_cigam',
  modelName: 'transportadoras_cigam',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
