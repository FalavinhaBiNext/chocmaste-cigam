import 'reflect-metadata';
import 'dotenv/config';
import { container } from 'tsyringe';
import '@/shared/container';
import { ProdutoRepository } from '@/modules/produto/repositories/produtoRepository';
import { DeParaProdutosRepository } from '@/modules/depara/repositories/deparaProdutosRepository';
import { ProdutoModel } from '@/modules/produto/models/produtoModel';
import sequelize from '@/database/sequelize';

async function clearProdutos() {
  const produtoRepo = container.resolve(ProdutoRepository);
  const deParaRepo = container.resolve(DeParaProdutosRepository);

  console.log('=== LIMPANDO TABELA DE PRODUTOS ===\n');

  // 1. Limpar De-Para
  console.log('1. Limpando mapeamentos De-Para...');
  try {
    const count = await deParaRepo.deleteAll();
    console.log(`   ${count} mapeamentos removidos`);
  } catch (error: any) {
    console.log(`   Erro: ${error.message}`);
  }

  // 2. Limpar produtos
  console.log('2. Limpando tabela de produtos...');
  try {
    await ProdutoModel.sequelize?.query('DELETE FROM produtos');
    console.log('   Produtos removidos');
  } catch (error: any) {
    console.log(`   Erro: ${error.message}`);
  }

  // 3. Verificar
  const remaining = await produtoRepo.findAll();
  console.log(`\nResultado: ${remaining.length} produtos restantes`);

  process.exit(0);
}

clearProdutos();
