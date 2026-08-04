import 'reflect-metadata';
import sequelize from '../../database/sequelize';
import { DeParaTransportadorasModel } from '../../modules/depara/models/deparaTransportadorasModel';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('[LOG] Conectado ao banco de dados.');

    const blingId = '6176393350';
    const cigamId = '000039';
    const carrierName = 'RODONAVES TRANSPORTES E ENCOMENDAS LTDA';

    // Check if it already exists
    const existingMapping = await DeParaTransportadorasModel.findOne({
      where: { id_bling: blingId }
    });

    if (existingMapping) {
      console.log(`[LOG] Mapeamento existente encontrado. Atualizando código CIGAM para ${cigamId}...`);
      await existingMapping.update({ id_cigam: cigamId, nome: carrierName });
      console.log('[LOG] Mapeamento atualizado com sucesso.');
    } else {
      console.log('[LOG] Nenhum mapeamento existente. Criando novo mapeamento...');
      const newMapping = await DeParaTransportadorasModel.create({
        id_bling: blingId,
        id_cigam: cigamId,
        nome: carrierName
      });
      console.log('[LOG] Mapeamento criado com sucesso:', JSON.stringify(newMapping, null, 2));
    }

  } catch (error) {
    console.error('[ERROR] Falha ao criar relacionamento de transportadora:', error);
  } finally {
    await sequelize.close();
  }
}

run();
