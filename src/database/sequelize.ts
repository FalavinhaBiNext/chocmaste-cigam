import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const config = require('./config/database.js')[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);

export default sequelize;
