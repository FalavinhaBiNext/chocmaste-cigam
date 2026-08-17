'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('pedidos', 'marketplace', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('pedidos', 'status_nfe', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'pendente',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('pedidos', 'marketplace');
    await queryInterface.removeColumn('pedidos', 'status_nfe');
  }
};
