'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('mercado_livre_tokens', 'scope', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('mercado_livre_tokens', 'scope', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
