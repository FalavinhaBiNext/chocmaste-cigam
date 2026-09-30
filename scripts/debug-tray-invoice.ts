/**
 * Script de diagnóstico (somente leitura) para investigar o erro "Invalid parameter id."
 * ao tentar atualizar uma NF-e via PUT /orders/:order_id/invoices/:invoice_id.
 *
 * Consulta GET /orders/:order_id/invoices para confirmar se a Tray reconhece o
 * invoice_id retornado anteriormente pelo POST de criação.
 *
 * Execução: npx ts-node --transpile-only -r tsconfig-paths/register scripts/debug-tray-invoice.ts <orderId>
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { container } from '@/shared/container';
import { TrayHttpClient } from '@/modules/tray/services/trayHttpClient';

async function main() {
  const orderId = process.argv[2] || '309215';

  console.log('='.repeat(65));
  console.log(` 🔍 DIAGNÓSTICO — GET /orders/${orderId}/invoices`);
  console.log('='.repeat(65));

  try {
    const httpClient = container.resolve(TrayHttpClient);
    const response = await httpClient.get(`/orders/${orderId}/invoices`);
    console.log('\nResposta bruta da Tray:\n');
    console.log(JSON.stringify(response, null, 2));
  } catch (error: any) {
    console.error('\n❌ Erro ao consultar invoices na Tray:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
