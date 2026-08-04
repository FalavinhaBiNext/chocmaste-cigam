import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class ClientesModel extends Model {
  public id!: string;
  public id_bling!: string | null;
  public nome!: string;
  public documento!: string | null;
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
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ClientesModel.init({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
      id_bling: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      nome: {
    type: Sequelize.STRING,
    allowNull: false
  },
  documento: {
    type: Sequelize.STRING,
    allowNull: true
  },
  telefone: {
    type: Sequelize.STRING,
    allowNull: true
  },
  celular: {
    type: Sequelize.STRING,
    allowNull: true
  },
  email: {
    type: Sequelize.STRING
  },
  endereco: {
    type: Sequelize.STRING
  },
  numero: {
    type: Sequelize.STRING
  },
  complemento: {
    type: Sequelize.STRING
  },
  bairro: {
    type: Sequelize.STRING
  },
  cidade: {
    type: Sequelize.STRING
  },
  uf: {
    type: Sequelize.STRING(2)
  },
  cep: {
    type: Sequelize.STRING(8)
  },
  active: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  sequelize,
  tableName: 'clientes',
  modelName: 'clientes',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
