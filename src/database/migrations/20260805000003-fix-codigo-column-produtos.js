'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('produtos');

    if (!tableDescription.codigo) {
      await queryInterface.addColumn('produtos', 'codigo', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!tableDescription.tipo) {
      await queryInterface.addColumn('produtos', 'tipo', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!tableDescription.situacao) {
      await queryInterface.addColumn('produtos', 'situacao', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!tableDescription.formato) {
      await queryInterface.addColumn('produtos', 'formato', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!tableDescription.descricao_curta) {
      await queryInterface.addColumn('produtos', 'descricao_curta', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    if (!tableDescription.unidade) {
      await queryInterface.addColumn('produtos', 'unidade', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!tableDescription.tipo_produto) {
      await queryInterface.addColumn('produtos', 'tipo_produto', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!tableDescription.condicao) {
      await queryInterface.addColumn('produtos', 'condicao', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }
    if (!tableDescription.marca) {
      await queryInterface.addColumn('produtos', 'marca', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!tableDescription.categoria_id) {
      await queryInterface.addColumn('produtos', 'categoria_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }
    if (!tableDescription.fornecedor_id) {
      await queryInterface.addColumn('produtos', 'fornecedor_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }
    if (!tableDescription.fornecedor_nome) {
      await queryInterface.addColumn('produtos', 'fornecedor_nome', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!tableDescription.fornecedor_codigo) {
      await queryInterface.addColumn('produtos', 'fornecedor_codigo', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!tableDescription.fornecedor_preco_custo) {
      await queryInterface.addColumn('produtos', 'fornecedor_preco_custo', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    }
    if (!tableDescription.ncm) {
      await queryInterface.addColumn('produtos', 'ncm', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!tableDescription.tem_variacoes) {
      await queryInterface.addColumn('produtos', 'tem_variacoes', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },

  async down (queryInterface, Sequelize) {
    // This migration is idempotent, no down needed
  }
};
