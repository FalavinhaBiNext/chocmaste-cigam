import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class ProdutosCigamModel extends Model {
  public id!: string;
  public id_cigam!: string;
  public id_de_para!: string | null;
  public nome!: string;
  public preco!: number;
  public unidade!: string | null;
  public ncm!: string | null;
  public quantidade_estoque!: number;
  public ativo!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ProdutosCigamModel.init({
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
  preco: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
  },
  unidade: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  ncm: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  quantidade_estoque: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  ativo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'produtos_cigam',
  modelName: 'produtos_cigam',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
