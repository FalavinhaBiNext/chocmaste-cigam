import { Sequelize } from 'sequelize';

async function main() {
  const s = new Sequelize('chocmastedb', 'chocmaster', 't1RIDMMqvRCU1VlBdHv7Wj0UQ3Q8CSMdBJY8x9iTifymXwPHXLXN1JvtUOV6l87d', {
    host: '187.77.44.253',
    port: 5441,
    dialect: 'postgres',
    logging: false,
  });

  const [tokens]: any = await s.query(`SELECT access_token FROM mercado_livre_tokens WHERE active = true LIMIT 1`);
  const token = tokens[0].access_token;

  console.log('1. Consultando /orders/2000018435886036 no Mercado Livre...');
  const res = await fetch('https://api.mercadolibre.com/orders/2000018435886036', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Status /orders:', res.status);
  const data = await res.json();
  if (res.ok) {
    console.log('Pedido encontrado no Mercado Livre!', {
      id: data.id,
      status: data.status,
      shipping: data.shipping,
      buyer: data.buyer?.nickname
    });
  } else {
    console.log('Resposta ML:', data);
  }

  // Também consultar evento do Bling desse pedido
  const [events]: any = await s.query(`
    SELECT id, event, pedido_id, numero_pedido, numero_loja, total_pedido, sync_status
    FROM events
    WHERE pedido_id = '26859241896' OR numero_loja = '2000018435886036' OR numero_pedido = 74390
  `);
  console.log('\nEventos do pedido:', events);

  process.exit(0);
}

main().catch(console.error);
