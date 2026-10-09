import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export type WebhookJobStatus = 'pendente' | 'processando' | 'concluido' | 'falha';

export class WebhookJobModel extends Model {
    public id!: string;
    public event_id!: string;
    public tipo!: string;
    public pedido_id!: number | null;
    public payload!: unknown;
    public status!: WebhookJobStatus;
    public tentativas!: number;
    public proxima_execucao!: Date;
    public iniciado_em!: Date | null;
    public finalizado_em!: Date | null;
    public ultimo_erro!: string | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

WebhookJobModel.init({
    id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
    },
    event_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    tipo: {
        type: Sequelize.STRING,
        allowNull: false
    },
    pedido_id: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    payload: {
        type: Sequelize.JSON,
        allowNull: false
    },
    status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pendente'
    },
    tentativas: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    proxima_execucao: {
        type: Sequelize.DATE,
        allowNull: false
    },
    iniciado_em: {
        type: Sequelize.DATE,
        allowNull: true
    },
    finalizado_em: {
        type: Sequelize.DATE,
        allowNull: true
    },
    ultimo_erro: {
        type: Sequelize.TEXT,
        allowNull: true
    }
}, {
    sequelize,
    tableName: 'webhook_jobs',
    modelName: 'webhook_job',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
})
