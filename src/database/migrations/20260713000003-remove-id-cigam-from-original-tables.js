'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('clientes', 'id_cigam');
    await queryInterface.removeColumn('formas_pagamento', 'id_cigam');
    await queryInterface.removeColumn('transportadoras', 'id_cigam');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('clientes', 'id_cigam', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('formas_pagamento', 'id_cigam', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('transportadoras', 'id_cigam', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
