'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('transportadoras', { 
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      id_bling:{
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      nome:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      fantasia: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      documento: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      id_cigam: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      codigo_divisao_cigam: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "70"
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
    await queryInterface.dropTable('transportadoras');
  }
};
