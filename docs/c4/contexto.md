# C4 – Nível 1: Contexto

```mermaid
flowchart LR
  U["Bibliotecário / cliente da API"] -->|"HTTP + JSON"| A["Biblioteca API<br/>(Node + TypeScript)"]
  P["Prometheus"] -->|"GET /metrics"| A
  A -->|"logs JSON (stdout)"| L["Coletor de logs"]
```

- **Biblioteca API**: único sistema. Expõe livros e empréstimos, documentação em `/docs` (Swagger UI) e contrato em `/openapi.json`.
- **Persistência**: em memória (ver [ADR 0001](../adr/0001-decisao.md)).
- **Observabilidade**: logs estruturados (pino) e métricas (prom-client) em `/metrics`.
