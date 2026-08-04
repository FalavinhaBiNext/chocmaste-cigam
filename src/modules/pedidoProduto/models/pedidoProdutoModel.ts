import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class PedidoProdutoModel extends Model {
  public id!: string;
  public id_pedido!: string;
  public id_produto!: string;
  public quantidade!: number;
  public preco!: number;
  public total!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

PedidoProdutoModel.init({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  id_pedido: {
    type: Sequelize.UUID,
    allowNull: false,
  },
  id_produto: {
    type: Sequelize.UUID,
    allowNull: false,
  },
  quantidade: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  preco: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false
  },
  total: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'pedido_produtos',
  modelName: 'pedido_produto',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
