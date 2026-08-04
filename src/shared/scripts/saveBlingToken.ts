import 'reflect-metadata';
import sequelize from '../../database/sequelize';
import { BlingModel } from '../../modules/bling/models/blingModel';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database successfully.');

    // Deactivate previous active tokens
    await BlingModel.update({ active: false }, { where: { active: true } });

    const expiresAt = new Date(Date.now() + 21600 * 1000);

    const token = await BlingModel.create({
      access_token: '5e689b5ff9c49f4bd382915088abc62ae7ee479d',
      refresh_token: '836fe9520cf8017f41545c12d490d923ba22f693',
      expires_at: expiresAt,
      scope: 'all',
      token_type: 'Bearer',
      access_token_url: 'https://bling.com.br/Api/v3/oauth/token',
      client_id: '9f0ca29809879971b0f7ea2ff86f099e1e1b3a76',
      client_secret: 'f957bc632b50caf0a73998103ff0c70b2afbb04e2b1c50275e887f9fcc42',
      active: true
    });

    console.log('Bling Token successfully saved manually:');
    console.log(JSON.stringify(token, null, 2));
  } catch (error) {
    console.error('Error saving Bling Token:', error);
  } finally {
    await sequelize.close();
  }
}

run();
