import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class ClientesCigamModel extends Model {
  public id!: string;
  public id_cigam!: string;
  public id_de_para!: string | null;
  public nome!: string;
  public documento!: string | null;
  public tipo_pessoa!: string | null;
  public telefone!: string | null;
  public celular!: string | null;
  public email!: string | null;
  public endereco!: string | null;
  public numero!: string | null;
  public complemento!: string | null;
  public bairro!: string | null;
  public cidade!: string | null;
  public uf!: string | null;
  public cep!: string | null;
  public ativo!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ClientesCigamModel.init({
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
  documento: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  tipo_pessoa: {
    type: Sequelize.STRING(1),
    allowNull: true,
  },
  telefone: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  celular: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  endereco: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  numero: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  complemento: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  bairro: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  cidade: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  uf: {
    type: Sequelize.STRING(2),
    allowNull: true,
  },
  cep: {
    type: Sequelize.STRING(8),
    allowNull: true,
  },
  ativo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'clientes_cigam',
  modelName: 'clientes_cigam',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
