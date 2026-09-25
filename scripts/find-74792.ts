import { Sequelize } from 'sequelize';

async function main() {
  const sMatriz = new Sequelize('chocmastedb', 'chocmaster', 't1RIDMMqvRCU1VlBdHv7Wj0UQ3Q8CSMdBJY8x9iTifymXwPHXLXN1JvtUOV6l87d', {
    host: '187.77.44.253',
    port: 5441,
    dialect: 'postgres',
    logging: false,
  });

  const [canal]: any = await sMatriz.query(`
    SELECT * FROM canal_vendas WHERE id_bling = '203345026'
  `);
  console.log('Canal de Venda 203345026:', canal);

  const [todosCanais]: any = await sMatriz.query(`
    SELECT id_bling, descricao, tipo, codigo_conta, unidade_negocio FROM canal_vendas
  `);
  console.log('Todos canais:', todosCanais);

  process.exit(0);
}

main().catch(console.error);
