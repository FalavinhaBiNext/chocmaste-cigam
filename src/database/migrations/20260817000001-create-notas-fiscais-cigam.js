'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('notas_fiscais_cigam', {
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('notas_fiscais_cigam');
  }
};
