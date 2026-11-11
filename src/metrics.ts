import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

// Registry por app (e não o global) para os testes poderem criar várias apps.
export function createMetrics() {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });

  const httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duração das requisições HTTP em segundos (base do SLO de latência)',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
    registers: [registry],
  });

  const loansCreated = new Counter({
    name: 'library_loans_created_total',
    help: 'Total de empréstimos criados',
    registers: [registry],
  });

  return { registry, httpDuration, loansCreated };
}

export type Metrics = ReturnType<typeof createMetrics>;
