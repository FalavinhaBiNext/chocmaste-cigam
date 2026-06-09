import 'reflect-metadata';
import app from '@/app';
import dotenv from 'dotenv';
import { logger } from './shared/utils/logger';

dotenv.config();

const PORT = Number(process.env.PORT) || 3333;
const NODE_ENV = process.env.NODE_ENV

app.listen(PORT, () => {
  logger.api(`Server running on port ${PORT} in ${NODE_ENV} mode.`);
      logger.route(
        `CTRL + CLICK: http://localhost:${PORT} to access application.`,
      );
});
