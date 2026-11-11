import 'dotenv/config';
import { buildApp } from './app';
import { loadConfig } from './config';
import { createLogger } from './logger';

const config = loadConfig();
const logger = createLogger(config.LOG_LEVEL);
const { app } = buildApp({ logger });

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, 'biblioteca-api no ar');
});

function shutdown(signal: string) {
  logger.info({ signal }, 'encerrando');
  server.close(() => process.exit(0));
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
