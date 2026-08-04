import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class PedidoModel extends Model {
  public id!: string;
  public id_bling!: string;
  public codigo_curto!: string;
  public numero_loja!: string;
  public data_pedido!: string;
  public total_produtos!: number;
  public total_venda!: number;
  public id_cliente_bling!: string;
  public nome_cliente!: string;
  public documento_cliente!: string;
  public tipo_pessoa!: string;
  public id_loja!: string;
  public desconto!: number;
  public quantidade_itens!: number;
  public status_venda!: string;
  public codigo_transportadora!: string;
  public valor_frete!: number;
  public nome_transportadora!: string;
  public codigo_rastreio!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

PedidoModel.init({
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
  codigo_curto: {
    type: Sequelize.STRING,
    allowNull: false
  },
  numero_loja: {
    type: Sequelize.STRING,
    allowNull: false
  },
  data_pedido: {
    type: Sequelize.DATEONLY,
    allowNull: false
  },
  total_produtos: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false
  },
  total_venda: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false
  },
  id_cliente_bling: {
    type: Sequelize.STRING,
    allowNull: false
  },
  nome_cliente: {
    type: Sequelize.STRING,
    allowNull: false
  },
  documento_cliente: {
    type: Sequelize.STRING,
    allowNull: false
  },
  tipo_pessoa: {
    type: Sequelize.STRING,
    allowNull: false
  },
  id_loja: {
    type: Sequelize.STRING,
    allowNull: false
  },
  desconto: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false
  },
  quantidade_itens: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  status_venda: {
    type: Sequelize.STRING,
    allowNull: false
  },
  codigo_transportadora: {
    type: Sequelize.STRING,
    allowNull: false
  },
  valor_frete: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false
  },
  nome_transportadora: {
    type: Sequelize.STRING,
    allowNull: false
  },
  codigo_rastreio: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'pedidos',
  modelName: 'pedido',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
