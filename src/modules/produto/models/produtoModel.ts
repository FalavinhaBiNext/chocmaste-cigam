import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class ProdutoModel extends Model {
  public id!: string;
  public id_bling!: string | null;
  public id_produto!: string | null;
  public nome!: string;
  public codigo!: string | null;
  public preco!: number;
  public tipo!: string | null;
  public situacao!: string | null;
  public formato!: string | null;
  public descricaoCurta!: string | null;
  public unidade!: string | null;
  public tipoProduto!: string | null;
  public condicao!: number | null;
  public marca!: string | null;
  public categoria_id!: number | null;
  public fornecedor_id!: number | null;
  public fornecedor_nome!: string | null;
  public fornecedor_codigo!: string | null;
  public fornecedor_precoCusto!: number | null;
  public ncm!: string | null;
  public temVariacoes!: boolean;
  public quantidade_estoque!: number;
  public ativo!: boolean;
  public unidade_negocio!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ProdutoModel.init({
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  id_bling: {
    type: Sequelize.STRING,
    allowNull: true
  },
  id_produto: {
    type: Sequelize.STRING,
    allowNull: true
  },
  nome: {
    type: Sequelize.STRING,
    allowNull: false
  },
  codigo: {
    type: Sequelize.STRING,
    allowNull: true
  },
  preco: {
    type: Sequelize.DECIMAL(10, 2),
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
  formato: {
    type: Sequelize.STRING,
    allowNull: true
  },
  descricaoCurta: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  unidade: {
    type: Sequelize.STRING,
    allowNull: true
  },
  tipoProduto: {
    type: Sequelize.STRING,
    allowNull: true
  },
  condicao: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  marca: {
    type: Sequelize.STRING,
    allowNull: true
  },
  categoria_id: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  fornecedor_id: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  fornecedor_nome: {
    type: Sequelize.STRING,
    allowNull: true
  },
  fornecedor_codigo: {
    type: Sequelize.STRING,
    allowNull: true
  },
  fornecedor_precoCusto: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: true
  },
  ncm: {
    type: Sequelize.STRING,
    allowNull: true
  },
  temVariacoes: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  quantidade_estoque: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  ativo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  unidade_negocio: {
    type: Sequelize.STRING,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'produtos',
  modelName: 'produto',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
