import 'reflect-metadata';
import 'dotenv/config';
import { container } from 'tsyringe';
import '@/shared/container';
import { BlingProdutoSyncService } from '@/modules/bling/services/blingProdutoSyncService';

async function testSincronizarComFila() {
  const service = container.resolve(BlingProdutoSyncService);

  console.log('=== TESTE: Sincronizar Todos com Fila ===\n');

  const inicio = Date.now();

  try {
    console.log('Iniciando sincronização com fila...');
    console.log('Concorrência: 3 | Delay: 400ms | Retries: 3\n');

    const result = await service.sincronizarTodosComFila((stats) => {
      process.stdout.write(`\rProgresso: ${stats.progress}% (${stats.completed}/${stats.total}) | Erros: ${stats.erros}`);
    });

    console.log('\n');

    const duracao = ((Date.now() - inicio) / 1000).toFixed(1);

    console.log(`✅ Sincronização com fila finalizada em ${duracao}s\n`);
    console.log('Resultado:');
    console.log(`  Criados: ${result.criados}`);
    console.log(`  Atualizados: ${result.atualizados}`);
    console.log(`  Erros: ${result.erros.length}`);

    if (result.erros.length > 0) {
      console.log('\nErros:');
      result.erros.slice(0, 10).forEach(e => console.log(`  - ${e}`));
      if (result.erros.length > 10) {
        console.log(`  ... e mais ${result.erros.length - 10} erros`);
      }
    }
  } catch (error: any) {
    console.error('\n❌ Erro na sincronização:', error.message);
  }
}

testSincronizarComFila();
