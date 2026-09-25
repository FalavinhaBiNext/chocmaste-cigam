/**
 * Script para listar os status de pedidos disponíveis no catálogo da loja Tray conectada.
 * Execução: npx ts-node -r tsconfig-paths/register scripts/list-tray-statuses.ts
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { container } from '@/shared/container';
import { TrayOrderService } from '@/modules/tray/services/trayOrderService';

async function main() {
  console.log('='.repeat(65));
  console.log(' 🏷️  STATUS DE PEDIDOS - LOJA TRAY CHOCMASTER');
  console.log('='.repeat(65));

  try {
    const orderService = container.resolve(TrayOrderService);
    let allStatuses: any[] = [];
    let page = 1;

    while (true) {
      const response = await orderService.listarStatus({ page, limit: 50 });
      const statuses = response.OrderStatuses || response;

      if (!Array.isArray(statuses) || statuses.length === 0) {
        break;
      }

      allStatuses.push(...statuses);

      const total = response.paging?.total || 0;
      if (allStatuses.length >= total || statuses.length < 50) {
        break;
      }
      page++;
    }

    if (allStatuses.length === 0) {
      console.log('Nenhum status retornado.');
      return;
    }

    const statuses = allStatuses;

    console.log('\nID   | Nome do Status                   | Tipo (Fluxo) | Cor Fundo | Padrão');
    console.log('-'.repeat(65));

    for (const item of statuses) {
      const s = item.OrderStatus || item;
      const id = String(s.id || '').padEnd(4);
      const name = String(s.status || s.name || '').padEnd(32);
      const type = String(s.type || '').padEnd(12);
      const bg = String(s.background || s.background_color || '-').padEnd(9);
      const isDefault = s.default === '1' ? 'Sim' : 'Não';

      console.log(`${id} | ${name} | ${type} | ${bg} | ${isDefault}`);
    }

    console.log('-'.repeat(65));
    console.log('\n💡 Para configurar o status automático após o envio de NF-e, adicione no seu .env:');
    console.log('   TRAY_STATUS_FATURADO_ID=<ID_DO_STATUS_ESCOLHIDO>\n');
  } catch (error: any) {
    console.error('❌ Erro ao listar status na Tray:', error.message);
  } finally {
    process.exit(0);
  }
}

main();
