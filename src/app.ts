import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { Express } from 'express';
import pino from 'pino';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { LibraryService } from './application/library-service';
import { Clock, IdGenerator } from './application/ports';
import { createErrorHandler } from './http/error-handler';
import { createRoutes } from './http/routes';
import {
  InMemoryBookRepository,
  InMemoryLoanRepository,
  SystemClock,
  UuidGenerator,
} from './infra/in-memory-repositories';
import { Logger } from './logger';
import { Metrics, createMetrics } from './metrics';

export interface AppOptions {
  logger?: Logger;
  clock?: Clock;
  ids?: IdGenerator;
}

function loadOpenApiSpec(): swaggerUi.JsonObject {
  const file = path.resolve(__dirname, '..', 'docs', 'openapi.yaml');
  return YAML.parse(fs.readFileSync(file, 'utf8')) as swaggerUi.JsonObject;
}

// Composition root: único lugar que escolhe as implementações concretas.
export function buildApp(options: AppOptions = {}): { app: Express; metrics: Metrics } {
  const logger = options.logger ?? pino({ level: 'silent' });
  const metrics = createMetrics();
  const service = new LibraryService(
    new InMemoryBookRepository(),
    new InMemoryLoanRepository(),
    options.clock ?? new SystemClock(),
    options.ids ?? new UuidGenerator(),
  );
  const spec = loadOpenApiSpec();

  const app = express();
  app.disable('x-powered-by');

  // Logs estruturados + métrica de latência por requisição
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    const requestId = req.header('x-request-id') ?? randomUUID();
    res.setHeader('x-request-id', requestId);
    res.on('finish', () => {
      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      const route = req.route ? `${req.baseUrl}${req.route.path}` : 'unmatched';
      metrics.httpDuration.observe(
        { method: req.method, route, status: String(res.statusCode) },
        seconds,
      );
      logger.info(
        {
          requestId,
          method: req.method,
          route,
          url: req.originalUrl,
          status: res.statusCode,
          durationMs: Math.round(seconds * 1000),
        },
        'request completed',
      );
    });
    next();
  });

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', metrics.registry.contentType);
    res.send(await metrics.registry.metrics());
  });

  app.get('/openapi.json', (_req, res) => {
    res.json(spec);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

  app.use(createRoutes(service, metrics));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Rota não encontrada' } });
  });
  app.use(createErrorHandler(logger));

  return { app, metrics };
}
