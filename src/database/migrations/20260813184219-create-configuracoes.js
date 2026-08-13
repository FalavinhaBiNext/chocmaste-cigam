'use strict';

const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('configuracoes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      chave: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      valor: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      descricao: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Insert default config
    await queryInterface.bulkInsert('configuracoes', [{
      id: crypto.randomUUID(),
      chave: 'envio_automatico_cigam',
      valor: 'true',
      descricao: 'Ativar ou desativar o envio automático de pedidos para o CIGAM',
      created_at: new Date(),
      updated_at: new Date(),
    }]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('configuracoes');
  }
};
