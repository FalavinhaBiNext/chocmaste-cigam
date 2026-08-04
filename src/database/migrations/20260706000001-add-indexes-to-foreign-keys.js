'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addIndex('pedido_produtos', ['id_pedido'], {
      name: 'idx_pedido_produtos_id_pedido'
    });
    await queryInterface.addIndex('pedido_produtos', ['id_produto'], {
      name: 'idx_pedido_produtos_id_produto'
    });
    await queryInterface.addIndex('pedidos', ['id_bling'], {
      name: 'idx_pedidos_id_bling'
    });
    await queryInterface.addIndex('produtos', ['id_bling'], {
      name: 'idx_produtos_id_bling'
    });
    await queryInterface.addIndex('clientes', ['id_bling'], {
      name: 'idx_clientes_id_bling'
    });
    await queryInterface.addIndex('transportadoras', ['id_bling'], {
      name: 'idx_transportadoras_id_bling'
    });
    await queryInterface.addIndex('formas_pagamento', ['id_bling'], {
      name: 'idx_formas_pagamento_id_bling'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('pedido_produtos', 'idx_pedido_produtos_id_pedido');
    await queryInterface.removeIndex('pedido_produtos', 'idx_pedido_produtos_id_produto');
    await queryInterface.removeIndex('pedidos', 'idx_pedidos_id_bling');
    await queryInterface.removeIndex('produtos', 'idx_produtos_id_bling');
    await queryInterface.removeIndex('clientes', 'idx_clientes_id_bling');
    await queryInterface.removeIndex('transportadoras', 'idx_transportadoras_id_bling');
    await queryInterface.removeIndex('formas_pagamento', 'idx_formas_pagamento_id_bling');
  }
};