import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class FormasPagamentoCigamModel extends Model {
  public id!: string;
  public id_cigam!: string;
  public id_de_para!: string | null;
  public descricao!: string;
  public tipo!: string | null;
  public ativo!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

FormasPagamentoCigamModel.init({
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
  descricao: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  tipo: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  ativo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'formas_pagamento_cigam',
  modelName: 'formas_pagamento_cigam',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
