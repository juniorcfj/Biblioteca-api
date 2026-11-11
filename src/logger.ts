import pino, { Logger } from 'pino';

export function createLogger(level: string): Logger {
  return pino({
    level,
    base: { service: 'biblioteca-api' },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export type { Logger };
