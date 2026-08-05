import Sequelize, { Model } from "sequelize"
import sequelize from "@/database/sequelize";

export class UsuarioModel extends Model {
    public id!: string;
    public nome!: string;
    public email!: string;
    public senha!: string;
    public role!: string;
    public ativo!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

UsuarioModel.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    nome: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    senha: {
        type: Sequelize.STRING,
        allowNull: false
    },
    role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'usuario'
    },
    ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    sequelize,
    tableName: 'usuarios',
    modelName: 'usuario',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
})
