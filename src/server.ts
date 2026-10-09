import 'reflect-metadata';
import app from '@/app';
import dotenv from 'dotenv';
import { logger } from './shared/utils/logger';
import { container } from './shared/container';
import { WebhookJobWorker } from './modules/webhookJobs/services/webhookJobWorker';

dotenv.config();

const PORT = Number(process.env.PORT) || 3333;
const NODE_ENV = process.env.NODE_ENV

const server = app.listen(PORT, () => {
  logger.api(`Server running on port ${PORT} in ${NODE_ENV} mode.`);
      logger.route(
        `CTRL + CLICK: http://localhost:${PORT} to access application.`,
      );
});

// Worker da fila de webhooks: processa em segundo plano os webhooks já
// respondidos (ver WebhookController).
const webhookJobWorker = container.resolve(WebhookJobWorker);
webhookJobWorker.start().catch((error) => {
  logger.error(`Falha ao iniciar o worker da fila de webhooks: ${error.message}`);
});

// No redeploy o Coolify envia SIGTERM: para de pegar novos jobs e fecha o
// servidor. Um job interrompido no meio volta para a fila na próxima subida.
const shutdown = (signal: string) => {
  logger.info(`${signal} recebido. Encerrando a API...`);
  webhookJobWorker.stop();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
