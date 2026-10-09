'use strict';

/**
 * Registro de cada chamada de NF-e feita à Tray (POST de cadastro e PUT de
 * atualização): URL (sem access_token), body enviado, status HTTP e resposta
 * completa da plataforma. Serve para diagnóstico e para responder ao suporte
 * da Tray com os dados exatos da requisição.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('tray_fiscal_logs', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      // POST (cadastro da nota) | PUT (atualização da nota)
      metodo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // envio | atualizacao_automatica | atualizacao_manual
      origem: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      invoice_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      url: {
        type: Sequelize.STRING(1024),
        allowNull: false,
      },
      request_body: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      http_status: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      response_body: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sucesso: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      erro: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      duracao_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('tray_fiscal_logs', ['order_id', 'created_at'], {
      name: 'tray_fiscal_logs_order_id_created_at_idx',
    });
  },

  async down (queryInterface) {
    await queryInterface.dropTable('tray_fiscal_logs');
  }
};
