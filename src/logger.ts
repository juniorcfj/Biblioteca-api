import pino from 'pino';

export type Logger = pino.Logger;

export function createLogger(level: string): Logger {
  return pino({
    level,
    base: { service: 'biblioteca-api' },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}