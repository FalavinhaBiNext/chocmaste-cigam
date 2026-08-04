'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const bridgeTable = {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      id_bling: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      id_cigam: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    };

    await queryInterface.createTable('de_para_produtos', { ...bridgeTable });
    await queryInterface.createTable('de_para_clientes', { ...bridgeTable });
    await queryInterface.createTable('de_para_formas_pagamento', { ...bridgeTable });
    await queryInterface.createTable('de_para_transportadoras', { ...bridgeTable });

    await queryInterface.addIndex('de_para_produtos', ['id_bling']);
    await queryInterface.addIndex('de_para_produtos', ['id_cigam']);
    await queryInterface.addIndex('de_para_clientes', ['id_bling']);
    await queryInterface.addIndex('de_para_clientes', ['id_cigam']);
    await queryInterface.addIndex('de_para_formas_pagamento', ['id_bling']);
    await queryInterface.addIndex('de_para_formas_pagamento', ['id_cigam']);
    await queryInterface.addIndex('de_para_transportadoras', ['id_bling']);
    await queryInterface.addIndex('de_para_transportadoras', ['id_cigam']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('de_para_transportadoras');
    await queryInterface.dropTable('de_para_formas_pagamento');
    await queryInterface.dropTable('de_para_clientes');
    await queryInterface.dropTable('de_para_produtos');
  },
};
