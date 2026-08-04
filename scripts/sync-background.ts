import 'reflect-metadata';
import 'dotenv/config';
import { container } from 'tsyringe';
import '@/shared/container';
import { BlingProdutoSyncService } from '@/modules/bling/services/blingProdutoSyncService';
import { logger } from '@/shared/utils/logger';

async function syncBackground() {
  const service = container.resolve(BlingProdutoSyncService);

  console.log('=== SYNC EM BACKGROUND INICIADO ===');
  console.log(`Horário: ${new Date().toLocaleString('pt-BR')}`);
  console.log('');

  const inicio = Date.now();

  try {
    const result = await service.sincronizarTodosComFila((stats) => {
      const elapsed = ((Date.now() - inicio) / 1000).toFixed(0);
      process.stdout.write(
        `\r[${elapsed}s] Progresso: ${stats.progress}% (${stats.completed}/${stats.total}) | Erros: ${stats.erros}`
      );
    });

    const duracao = ((Date.now() - inicio) / 1000).toFixed(1);

    console.log('\n');
    console.log('=== SYNC EM BACKGROUND FINALIZADO ===');
    console.log(`Duração: ${duracao}s`);
    console.log(`Criados: ${result.criados}`);
    console.log(`Atualizados: ${result.atualizados}`);
    console.log(`Erros: ${result.erros.length}`);

    if (result.erros.length > 0) {
      console.log('\nPrimeiros 10 erros:');
      result.erros.slice(0, 10).forEach(e => console.log(`  - ${e}`));
    }

    process.exit(0);
  } catch (error: any) {
    console.error('\n=== ERRO NO SYNC ===');
    console.error(error.message);
    process.exit(1);
  }
}

syncBackground();
