import 'reflect-metadata';
import sequelize from '../../database/sequelize';
import { EventModel } from '../../modules/events/models/eventModel';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('[LOG] Conectado ao banco de dados.');

    const count = await EventModel.count();
    console.log(`[LOG] Encontrados ${count} eventos para remover.`);

    const deleted = await EventModel.destroy({ where: {}, truncate: false });
    console.log(`[LOG] ${deleted} eventos foram excluídos com sucesso.`);

  } catch (error) {
    console.error('[ERROR] Falha ao remover os eventos:', error);
  } finally {
    await sequelize.close();
  }
}

run();
