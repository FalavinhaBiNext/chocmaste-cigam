'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      "SELECT id FROM usuarios WHERE email = 'admin@chocmaster.com'"
    );
    if (existing[0].length > 0) return;

    const hash = await bcrypt.hash('admin123', 10);
    await queryInterface.bulkInsert('usuarios', [{
      id: uuidv4(),
      nome: 'Admin',
      email: 'admin@chocmaster.com',
      senha: hash,
      role: 'admin',
      ativo: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('usuarios', { email: 'admin@chocmaster.com' });
  }
};
