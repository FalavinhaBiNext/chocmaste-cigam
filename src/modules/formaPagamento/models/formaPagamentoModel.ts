import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class FormaPagamentoModel extends Model {
  public id!: string;
  public id_bling!: string;
  public descricao!: string;
  public tipo!: string | null;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

FormaPagamentoModel.init({
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
      active: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  sequelize,
  tableName: 'formas_pagamento',
  modelName: 'forma_pagamento',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
