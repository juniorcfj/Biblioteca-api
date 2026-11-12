import { defineConfig } from 'vitest/config';
 
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // server.ts é só bootstrap; ports.ts só tem interfaces (sem código executável)
      exclude: ['src/server.ts', 'src/application/ports.ts'],
      reporter: ['text', 'lcov'],
      // Coverage mínimo declarado (ver README). O build falha se ficar abaixo.
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 70 },
    },
  },
});