'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('produtos');

    const renames = [
      ['descricaoCurta', 'descricao_curta'],
      ['tipoProduto', 'tipo_produto'],
      ['fornecedor_precoCusto', 'fornecedor_preco_custo'],
      ['temVariacoes', 'tem_variacoes'],
    ];

    for (const [oldName, newName] of renames) {
      if (table[oldName] && !table[newName]) {
        await queryInterface.renameColumn('produtos', oldName, newName);
      }
    }
  },

  async down (queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('produtos');

    const renames = [
      ['descricao_curta', 'descricaoCurta'],
      ['tipo_produto', 'tipoProduto'],
      ['fornecedor_preco_custo', 'fornecedor_precoCusto'],
      ['tem_variacoes', 'temVariacoes'],
    ];

    for (const [oldName, newName] of renames) {
      if (table[oldName] && !table[newName]) {
        await queryInterface.renameColumn('produtos', oldName, newName);
      }
    }
  }
};
