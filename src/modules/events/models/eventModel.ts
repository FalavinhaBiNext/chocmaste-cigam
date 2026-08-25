import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class EventModel extends Model {
    public id!: string;
    public event!: string;
    public company_id!: string;
    public pedido_id!: number;
    public data_pedido!: Date;
    public numero_pedido!: number;
    public numero_loja!: string;
    public total_pedido!: number;
    public cigam_sincronizado!: boolean;
    public cigam_pedido_id!: string | null;
    public sync_status!: 'pendente' | 'sincronizado' | 'falha';
    public error_message!: string | null;
    public retry_count!: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

EventModel.init({
    id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      event: {
        type: Sequelize.STRING,
        allowNull: false
      },
      company_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      pedido_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      data_pedido: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      numero_pedido: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      numero_loja: {
        type: Sequelize.STRING,
        allowNull: false
      },
      total_pedido: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      cigam_sincronizado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      cigam_pedido_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      sync_status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pendente'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      retry_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
}, {
    sequelize,
    tableName: 'events',
    modelName: 'event',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
})
