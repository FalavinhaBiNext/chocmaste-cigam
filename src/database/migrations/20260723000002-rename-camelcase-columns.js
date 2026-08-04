'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('produtos', 'descricaoCurta', 'descricao_curta');
    await queryInterface.renameColumn('produtos', 'tipoProduto', 'tipo_produto');
    await queryInterface.renameColumn('produtos', 'fornecedor_precoCusto', 'fornecedor_preco_custo');
    await queryInterface.renameColumn('produtos', 'temVariacoes', 'tem_variacoes');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('produtos', 'descricao_curta', 'descricaoCurta');
    await queryInterface.renameColumn('produtos', 'tipo_produto', 'tipoProduto');
    await queryInterface.renameColumn('produtos', 'fornecedor_preco_custo', 'fornecedor_precoCusto');
    await queryInterface.renameColumn('produtos', 'tem_variacoes', 'temVariacoes');
  }
};
