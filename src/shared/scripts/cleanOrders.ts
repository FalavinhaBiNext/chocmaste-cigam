import 'reflect-metadata';
import sequelize from '../../database/sequelize';
import { PedidoModel } from '../../modules/pedido/models/pedidoModel';
import { PedidoProdutoModel } from '../../modules/pedidoProduto/models/pedidoProdutoModel';
import { EventModel } from '../../modules/events/models/eventModel';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    const orderIdBling = '25957584103';

    // Find all local UUIDs for this order
    const orders = await PedidoModel.findAll({ where: { id_bling: orderIdBling } });
    const orderUuids = orders.map(o => o.id);

    console.log(`Found ${orders.length} duplicate orders in DB to clean up.`);

    // 1. Delete associated products in order_produtos
    if (orderUuids.length > 0) {
      const deletedProducts = await PedidoProdutoModel.destroy({
        where: { id_pedido: orderUuids }
      });
      console.log(`Deleted ${deletedProducts} order products.`);
    }

    // 2. Delete events associated
    const deletedEvents = await EventModel.destroy({
      where: { pedido_id: Number(orderIdBling) }
    });
    console.log(`Deleted ${deletedEvents} associated events.`);

    // 3. Delete orders
    const deletedOrders = await PedidoModel.destroy({
      where: { id_bling: orderIdBling }
    });
    console.log(`Deleted ${deletedOrders} order records.`);

    console.log('Database cleanup completed successfully.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await sequelize.close();
  }
}

run();
