import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelizeMadalena = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASS!,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function check() {
  try {
    const [pedidos] = await sequelizeMadalena.query(`
      SELECT id, id_bling, codigo_curto, numero_pedido_cigam, unidade_negocio, total_venda, id_loja, marketplace, created_at
      FROM pedidos
      WHERE numero_pedido_cigam IN ('000252', '000267', '000297');
    `);
    console.log('PEDIDOS NO BANCO MADALENA:', JSON.stringify(pedidos, null, 2));

    const [eventos] = await sequelizeMadalena.query(`
      SELECT id, numero_pedido, company_id, sync_status, cigam_pedido_id, created_at
      FROM events
      WHERE numero_pedido IN (11222, 11236, 11248);
    `);
    console.log('EVENTOS NO BANCO MADALENA:', JSON.stringify(eventos, null, 2));

  } catch(e: any) {
    console.error('ERRO:', e.message);
  } finally {
    await sequelizeMadalena.close();
  }
}
check();
