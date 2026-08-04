'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('produtos', 'codigo', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'tipo', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'situacao', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'formato', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'descricao_curta', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'unidade', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'tipo_produto', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'condicao', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'marca', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'categoria_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'fornecedor_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'fornecedor_nome', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'fornecedor_codigo', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'fornecedor_preco_custo', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'ncm', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('produtos', 'tem_variacoes', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('produtos', 'codigo');
    await queryInterface.removeColumn('produtos', 'tipo');
    await queryInterface.removeColumn('produtos', 'situacao');
    await queryInterface.removeColumn('produtos', 'formato');
    await queryInterface.removeColumn('produtos', 'descricao_curta');
    await queryInterface.removeColumn('produtos', 'unidade');
    await queryInterface.removeColumn('produtos', 'tipo_produto');
    await queryInterface.removeColumn('produtos', 'condicao');
    await queryInterface.removeColumn('produtos', 'marca');
    await queryInterface.removeColumn('produtos', 'categoria_id');
    await queryInterface.removeColumn('produtos', 'fornecedor_id');
    await queryInterface.removeColumn('produtos', 'fornecedor_nome');
    await queryInterface.removeColumn('produtos', 'fornecedor_codigo');
    await queryInterface.removeColumn('produtos', 'fornecedor_preco_custo');
    await queryInterface.removeColumn('produtos', 'ncm');
    await queryInterface.removeColumn('produtos', 'tem_variacoes');
  }
};
