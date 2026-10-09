'use strict';

/**
 * Fila persistida de webhooks recebidos. O endpoint do webhook só grava o job
 * e responde na hora; o processamento pesado (Bling + CIGAM) roda depois, num
 * worker em segundo plano, com novas tentativas automáticas.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('webhook_jobs', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      // eventId enviado pela plataforma de origem; garante que webhooks
      // reenviados não sejam enfileirados duas vezes.
      event_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      tipo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      pedido_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      payload: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      // pendente | processando | concluido | falha
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pendente',
      },
      tentativas: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      proxima_execucao: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      iniciado_em: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      finalizado_em: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ultimo_erro: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('webhook_jobs', ['status', 'proxima_execucao'], {
      name: 'webhook_jobs_status_proxima_execucao_idx',
    });
  },

  async down (queryInterface) {
    await queryInterface.dropTable('webhook_jobs');
  }
};
