import 'reflect-metadata';
import 'dotenv/config';
import { container } from 'tsyringe';
import '@/shared/container';
import { BlingProdutoSyncService } from '@/modules/bling/services/blingProdutoSyncService';

async function testSalvarProduto() {
  const service = container.resolve(BlingProdutoSyncService);

  console.log('=== TESTE: Salvar Produto Bling #16566745325 ===\n');

  try {
    console.log('Buscando produto na API Bling...');
    const produto = await service.salvarProduto('16566745325');

    console.log('\n✅ Produto salvo com sucesso!\n');
    console.log('Dados salvos:');
    console.log(JSON.stringify(produto, null, 2));
  } catch (error: any) {
    console.error('\n❌ Erro ao salvar produto:', error.message);
  }
}

testSalvarProduto();
