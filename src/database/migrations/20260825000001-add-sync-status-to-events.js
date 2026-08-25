'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('events', 'sync_status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'pendente',
    });

    await queryInterface.addColumn('events', 'error_message', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('events', 'retry_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.bulkUpdate(
      'events',
      { sync_status: 'sincronizado' },
      { cigam_sincronizado: true }
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('events', 'sync_status');
    await queryInterface.removeColumn('events', 'error_message');
    await queryInterface.removeColumn('events', 'retry_count');
  }
};
