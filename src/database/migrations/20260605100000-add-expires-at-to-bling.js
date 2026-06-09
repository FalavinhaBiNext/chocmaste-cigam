'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('bling', 'expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('bling', 'scope', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('bling', 'token_type', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('bling', 'expires_at');
    await queryInterface.removeColumn('bling', 'scope');
    await queryInterface.removeColumn('bling', 'token_type');
  }
};
