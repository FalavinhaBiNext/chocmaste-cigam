'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('clientes', 'ie', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('clientes', 'tipo', {
      type: Sequelize.STRING(1),
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('clientes', 'ie');
    await queryInterface.removeColumn('clientes', 'tipo');
  }
};
