import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { container } from '../src/shared/container';
import { ClientesService } from '../src/modules/clientes/services/clientesService';

async function run() {
  try {
    const clientesService = container.resolve(ClientesService);
    const cliente = await clientesService.findByIdBling('18172903829');
    console.log('--- Dados do cliente salvos localmente (vindos do Bling) ---');
    console.log(JSON.stringify(cliente, null, 2));
  } catch (error) {
    console.error('Erro ao ler cliente:', error);
  }
}

run();
