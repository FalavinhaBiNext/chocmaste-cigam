import 'reflect-metadata';
import sequelize from '../../database/sequelize';
import { PedidoModel } from '../../modules/pedido/models/pedidoModel';

async function run() {
  try {
    await sequelize.authenticate();
    const orders = await PedidoModel.findAll({ limit: 5 });
    console.log('Orders found:', orders.length);
    orders.forEach(o => {
      console.log('Order:', {
        id: o.id,
        id_bling: o.id_bling,
        nome_transportadora: o.nome_transportadora,
        codigo_transportadora: o.codigo_transportadora,
        codigo_rastreio: o.codigo_rastreio
      });
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

run();
