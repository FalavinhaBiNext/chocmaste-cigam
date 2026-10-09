import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export type TrayFiscalLogOrigem = 'envio' | 'atualizacao_automatica' | 'atualizacao_manual';

export class TrayFiscalLogModel extends Model {
    public id!: string;
    public metodo!: 'POST' | 'PUT';
    public origem!: TrayFiscalLogOrigem;
    public order_id!: string;
    public invoice_id!: string | null;
    public url!: string;
    public request_body!: string | null;
    public http_status!: number | null;
    public response_body!: string | null;
    public sucesso!: boolean;
    public erro!: string | null;
    public duracao_ms!: number | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

TrayFiscalLogModel.init({
    id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
    },
    metodo: {
        type: Sequelize.STRING,
        allowNull: false
    },
    origem: {
        type: Sequelize.STRING,
        allowNull: false
    },
    order_id: {
        type: Sequelize.STRING,
        allowNull: false
    },
    invoice_id: {
        type: Sequelize.STRING,
        allowNull: true
    },
    url: {
        type: Sequelize.STRING(1024),
        allowNull: false
    },
    request_body: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    http_status: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    response_body: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    sucesso: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    erro: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    duracao_ms: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
}, {
    sequelize,
    tableName: 'tray_fiscal_logs',
    modelName: 'tray_fiscal_log',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
})
