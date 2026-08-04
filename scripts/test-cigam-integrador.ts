import 'reflect-metadata';
import 'dotenv/config';
import { container } from 'tsyringe';
import '@/shared/container';
import { CigamIntegradorHttpClient } from '@/modules/cigam/services/cigamIntegradorHttpClient';
import { CigamMateriaisIntegradorService } from '@/modules/cigam/services/cigamMateriaisIntegradorService';

const AMBIENTE = process.env.CIGAM_AMBIENTE_TESTE || 'homologacao';

async function testListar() {
  console.log('\n=== TESTE: Listar Materiais ===');
  const service = container.resolve(CigamMateriaisIntegradorService);

  try {
    const materiais = await service.listarMateriais();
    console.log(`Materiais encontrados: ${materiais.length}`);
    materiais.forEach((m, i) => {
      console.log(`  [${i + 1}] ${m.Codigo} - ${m.Descricao} (Grupo: ${m.CodigoGrupo})`);
    });
    return materiais;
  } catch (error: any) {
    console.error('Erro ao listar materiais:', error.message);
    return [];
  }
}

async function testCadastrar() {
  console.log('\n=== TESTE: Cadastrar Material ===');
  const service = container.resolve(CigamMateriaisIntegradorService);

  const material = {
    codigoGrupo: '001',
    codigoSubGrupo: '01',
    codigoMaterial: `TESTE${Date.now()}`,
    descricao: 'Material de teste - Chocmaster',
    tipo: 'A',
    codigoUnidadeMedida: 'UN',
    utilizaGrade: 'N',
  };

  console.log('Payload:', JSON.stringify(material, null, 2));

  try {
    const result = await service.cadastrarMaterial(material);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('Erro ao cadastrar material:', error.message);
    return null;
  }
}

async function testSincronizar() {
  console.log('\n=== TESTE: Sincronizar com Local ===');
  const service = container.resolve(CigamMateriaisIntegradorService);

  try {
    const result = await service.sincronizarComLocal();
    console.log('Resultado:', JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('Erro ao sincronizar:', error.message);
    return null;
  }
}

async function main() {
  console.log('Ambiente:', AMBIENTE);
  console.log('URL Integrador:', process.env.CIGAM_INTEGRADOR_URL);

  await testListar();
  await testCadastrar();
  await testListar();
  await testSincronizar();

  console.log('\n=== TESTES FINALIZADOS ===');
}

main().catch(console.error);
