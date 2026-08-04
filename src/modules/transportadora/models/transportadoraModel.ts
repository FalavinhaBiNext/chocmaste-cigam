import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class TransportadoraModel extends Model {
  public id!: string;
  public id_bling!: string;
  public nome!: string;
  public fantasia!: string;
  public documento!: string;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

TransportadoraModel.init({
  id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      id_bling:{
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      nome:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      fantasia: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      documento: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
}, {
  sequelize,
  tableName: 'transportadoras',
  modelName: 'transportadora',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})