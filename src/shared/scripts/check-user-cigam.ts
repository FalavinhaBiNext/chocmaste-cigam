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

const sequelizeMatriz = new Sequelize('chocmastedb', 'chocmaster', 't1RIDMMqvRCU1VlBdHv7Wj0UQ3Q8CSMdBJY8x9iTifymXwPHXLXN1JvtUOV6l87d', {
  host: '187.77.44.253',
  port: 5441,
  dialect: 'postgres',
  logging: false
});

async function check() {
  try {
    const [userMadalena] = await sequelizeMadalena.query('SELECT * FROM "usuariosCigam";');
    console.log('USUARIOS CIGAM MADALENA:', JSON.stringify(userMadalena, null, 2));

    const [userMatriz] = await sequelizeMatriz.query('SELECT * FROM "usuariosCigam";');
    console.log('USUARIOS CIGAM MATRIZ:', JSON.stringify(userMatriz, null, 2));
  } catch(e: any) {
    console.error('ERRO:', e.message);
  } finally {
    await sequelizeMadalena.close();
    await sequelizeMatriz.close();
  }
}
check();
