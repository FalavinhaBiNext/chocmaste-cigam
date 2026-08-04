'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('pedidos', { 
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
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('pedidos');
  }
};
