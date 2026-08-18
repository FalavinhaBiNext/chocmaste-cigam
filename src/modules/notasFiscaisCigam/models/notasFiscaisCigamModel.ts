import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class NotasFiscaisCigamModel extends Model {
  public id!: string;
  public numero_pedido_cigam!: string;
  public numero_pedido_marketplace!: string | null;
  public marketplace!: string | null;
  public unidade_negocio!: string | null;
  public data_faturamento!: string | null;
  public numero_nf!: string | null;
  public serie_nf!: string | null;
  public chave_acesso!: string | null;
  public enviado_marketplace!: boolean;
  public xml_content!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

NotasFiscaisCigamModel.init({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  numero_pedido_cigam: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  numero_pedido_marketplace: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  marketplace: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  },
  unidade_negocio: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  data_faturamento: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  numero_nf: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  serie_nf: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  chave_acesso: {
    type: Sequelize.STRING,
    allowNull: true,
    unique: true,
  },
  enviado_marketplace: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  xml_content: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'notas_fiscais_cigam',
  modelName: 'notas_fiscais_cigam',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
