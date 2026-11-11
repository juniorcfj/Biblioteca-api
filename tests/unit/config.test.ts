import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config';

describe('loadConfig', () => {
  it('aplica defaults', () => {
    expect(loadConfig({})).toEqual({ NODE_ENV: 'development', PORT: 3000, LOG_LEVEL: 'info' });
  });

  it('converte PORT para número', () => {
    expect(loadConfig({ PORT: '8080' }).PORT).toBe(8080);
  });

  it('rejeita valores inválidos', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow();
    expect(() => loadConfig({ LOG_LEVEL: 'verboso' })).toThrow();
  });
});
