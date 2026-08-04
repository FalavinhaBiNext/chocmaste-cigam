import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { container } from '../src/shared/container';
import { BlingSyncService } from '../src/modules/bling/services/blingSyncService';

async function run() {
  console.log('--- Iniciando Sincronização Completa de Cadastro Bling -> Banco Local ---');
  try {
    const syncService = container.resolve(BlingSyncService);
    const results = await syncService.syncAll();
    console.log('--- Sincronização finalizada com sucesso! ---');
    console.log(JSON.stringify(results, null, 2));
  } catch (error: any) {
    console.error('--- Falha na sincronização: ---');
    console.error(error);
  }
}

run();
