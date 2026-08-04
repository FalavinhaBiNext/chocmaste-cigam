import 'reflect-metadata';
import 'dotenv/config';
import { container } from 'tsyringe';
import '@/shared/container';
import { BlingProdutoSyncService } from '@/modules/bling/services/blingProdutoSyncService';

async function testSincronizarTodos() {
  const service = container.resolve(BlingProdutoSyncService);

  console.log('=== TESTE: Sincronizar Todos os Produtos do Bling ===\n');

  const inicio = Date.now();

  try {
    console.log('Iniciando sincronização...');
    const result = await service.sincronizarTodos();

    const duracao = ((Date.now() - inicio) / 1000).toFixed(1);

    console.log(`\n✅ Sincronização finalizada em ${duracao}s\n`);
    console.log('Resultado:');
    console.log(`  Criados: ${result.criados}`);
    console.log(`  Atualizados: ${result.atualizados}`);
    console.log(`  Erros: ${result.erros.length}`);

    if (result.erros.length > 0) {
      console.log('\nErros:');
      result.erros.forEach(e => console.log(`  - ${e}`));
    }
  } catch (error: any) {
    console.error('\n❌ Erro na sincronização:', error.message);
  }
}

testSincronizarTodos();
