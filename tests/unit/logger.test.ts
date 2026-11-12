import { describe, expect, it } from 'vitest';
import { createLogger } from '../../src/logger';

describe('createLogger', () => {
  it('usa o nível informado e inclui o nome do serviço', () => {
    const logger = createLogger('warn');
    expect(logger.level).toBe('warn');
    expect(logger.bindings()).toEqual({ service: 'biblioteca-api' });
  });

  it('aceita o nível silent', () => {
    expect(createLogger('silent').level).toBe('silent');
  });
});