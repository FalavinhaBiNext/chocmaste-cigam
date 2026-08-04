'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('produtos_cigam', 'id_de_para', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'de_para_produtos', key: 'id' },
    });
    await queryInterface.addColumn('clientes_cigam', 'id_de_para', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'de_para_clientes', key: 'id' },
    });
    await queryInterface.addColumn('formas_pagamento_cigam', 'id_de_para', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'de_para_formas_pagamento', key: 'id' },
    });
    await queryInterface.addColumn('transportadoras_cigam', 'id_de_para', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'de_para_transportadoras', key: 'id' },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('transportadoras_cigam', 'id_de_para');
    await queryInterface.removeColumn('formas_pagamento_cigam', 'id_de_para');
    await queryInterface.removeColumn('clientes_cigam', 'id_de_para');
    await queryInterface.removeColumn('produtos_cigam', 'id_de_para');
  },
};
