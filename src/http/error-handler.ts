import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../domain/errors';
import { Logger } from '../logger';

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  NO_COPIES_AVAILABLE: 409,
  LOAN_ALREADY_RETURNED: 409,
};

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        },
      });
      return;
    }

    if (err instanceof DomainError) {
      const status = STATUS_BY_CODE[err.code] ?? 500;
      if (status >= 500) logger.error({ err }, 'violação de invariante');
      res.status(status).json({ error: { code: err.code, message: err.message } });
      return;
    }

    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: { code: 'INVALID_JSON', message: 'JSON malformado' } });
      return;
    }

    logger.error({ err }, 'erro não tratado');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno' } });
  };
}
