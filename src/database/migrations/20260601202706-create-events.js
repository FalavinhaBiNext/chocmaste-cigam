'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('events', { 
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
     await queryInterface.dropTable('events');
  }
};
