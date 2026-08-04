import 'reflect-metadata';
import 'dotenv/config';
import { container } from 'tsyringe';
import '@/shared/container';
import { ProdutoRepository } from '@/modules/produto/repositories/produtoRepository';
import { BlingProdutoSyncService } from '@/modules/bling/services/blingProdutoSyncService';
import { DeParaProdutosRepository } from '@/modules/depara/repositories/deparaProdutosRepository';
import { ProdutoModel } from '@/modules/produto/models/produtoModel';
import { logger } from '@/shared/utils/logger';
import sequelize from '@/database/sequelize';

async function resetAndSync() {
  const produtoRepo = container.resolve(ProdutoRepository);
  const deParaRepo = container.resolve(DeParaProdutosRepository);
  const syncService = container.resolve(BlingProdutoSyncService);

  console.log('=== RESET E SYNC COMPLETO ===\n');

  // 1. Limpar usando SQL direto com foreign keys desabilitadas
  console.log('1. Limpando banco de dados...');
  try {
    await sequelize.query('PRAGMA foreign_keys = OFF');
    await sequelize.query('DELETE FROM de_para_produtos');
    await sequelize.query('DELETE FROM produtos');
    await sequelize.query('PRAGMA foreign_keys = ON');
    console.log('   ✅ Tabelas limpas\n');
  } catch (error: any) {
    console.log(`   ❌ Erro ao limpar: ${error.message}\n`);
    process.exit(1);
  }

  // 2. Sincronizar do Bling
  console.log('2. Iniciando sincronização do Bling...\n');

  const inicio = Date.now();

  try {
    const result = await syncService.sincronizarTodosComFila((stats) => {
      const elapsed = ((Date.now() - inicio) / 1000).toFixed(0);
      process.stdout.write(
        `\r[${elapsed}s] Progresso: ${stats.progress}% (${stats.completed}/${stats.total}) | Erros: ${stats.erros}`
      );
    });

    console.log('\n');
    const duracao = ((Date.now() - inicio) / 1000).toFixed(1);

    console.log('=== RESULTADO FINAL ===');
    console.log(`Duração: ${duracao}s`);
    console.log(`Produtos criados: ${result.criados}`);
    console.log(`Produtos atualizados: ${result.atualizados}`);
    console.log(`Erros: ${result.erros.length}`);

    if (result.erros.length > 0) {
      console.log('\nPrimeiros 10 erros:');
      result.erros.slice(0, 10).forEach(e => console.log(`  - ${e}`));
    }

    console.log('\n✅ Reset e sincronização concluídos!');
  } catch (error: any) {
    console.error(`\n❌ Erro na sincronização: ${error.message}`);
  }

  process.exit(0);
}

resetAndSync();
