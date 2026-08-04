import sequelize from "@/database/sequelize";
import Sequelize, { Model } from 'sequelize'

export class UsuarioCigamModel extends Model {
    public id!: string;
    public ambiente!: string;
    public login!: string;
    public senha!: string;
    public url_ambiente!: string;
    public ativo!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

UsuarioCigamModel.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      ambiente: {
        type: Sequelize.STRING,
        allowNull: false
      },
      login: {
        type: Sequelize.STRING,
        allowNull: false
      },
      senha: {
        type: Sequelize.STRING,
        allowNull: false
      },
      url_ambiente: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
}, {
    sequelize,
    tableName: 'usuariosCigam',
    modelName: 'usuarioCigam',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
})