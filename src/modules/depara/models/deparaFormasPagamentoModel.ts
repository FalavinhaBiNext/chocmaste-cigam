import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class DeParaFormasPagamentoModel extends Model {
  public id!: string;
  public id_bling!: string;
  public id_cigam!: string;
  public nome!: string;
  public ativo!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

DeParaFormasPagamentoModel.init({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  id_bling: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  id_cigam: {
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
  tableName: 'de_para_formas_pagamento',
  modelName: 'de_para_formas_pagamento',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
