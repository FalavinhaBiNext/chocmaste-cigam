import 'reflect-metadata';
import 'dotenv/config';
import { container } from 'tsyringe';
import '@/shared/container';
import { ProdutoService } from '@/modules/produto/services/produtoService';

async function testListarProdutos() {
  const service = container.resolve(ProdutoService);

  console.log('=== TESTE: Listar Todos os Produtos ===\n');

  try {
    const produtos = await service.findAll();

    console.log(`Total de produtos: ${produtos.length}\n`);

    produtos.forEach((p, i) => {
      console.log(`[${i + 1}] ${p.nome}`);
      console.log(`    ID Local: ${p.id}`);
      console.log(`    ID Bling: ${p.id_bling || '-'}`);
      console.log(`    Código: ${p.codigo || '-'}`);
      console.log(`    Preço: R$ ${p.preco}`);
      console.log(`    Marca: ${p.marca || '-'}`);
      console.log(`    NCM: ${p.ncm || '-'}`);
      console.log(`    Tem Variações: ${p.temVariacoes ? 'Sim' : 'Não'}`);
      console.log(`    Ativo: ${p.ativo ? 'Sim' : 'Não'}`);
      console.log('');
    });
  } catch (error: any) {
    console.error('❌ Erro ao listar produtos:', error.message);
  }
}

testListarProdutos();
