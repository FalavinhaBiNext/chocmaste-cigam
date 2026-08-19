import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class CanalVendaModel extends Model {
  public id!: string;
  public id_bling!: string;
  public descricao!: string;
  public tipo!: string | null;
  public situacao!: string | null;
  public ativo!: boolean;
  public codigo_conta!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CanalVendaModel.init({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  id_bling: {
    type: Sequelize.STRING,
    allowNull: false
  },
  descricao: {
    type: Sequelize.STRING,
    allowNull: false
  },
  tipo: {
    type: Sequelize.STRING,
    allowNull: true
  },
  situacao: {
    type: Sequelize.STRING,
    allowNull: true
  },
  ativo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  codigo_conta: {
    type: Sequelize.STRING,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'canais_venda',
  modelName: 'canal_venda',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
