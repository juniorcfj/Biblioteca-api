# Biblioteca API

[![CI](https://github.com/SEU_USUARIO/biblioteca-api/actions/workflows/ci.yml/badge.svg)](https://github.com/SEU_USUARIO/biblioteca-api/actions/workflows/ci.yml)

API de domínio único (TypeScript + Express) para **livros e empréstimos**.
Fluxo principal: **cadastrar livro → emprestar → devolver**, com controle de estoque e prazo de 14 dias.

## Entrega

| Item | Link |
|---|---|
| Repositório | https://github.com/SEU_USUARIO/biblioteca-api _(se privado: convite enviado para o avaliador)_ |
| Execução verde do CI | https://github.com/SEU_USUARIO/biblioteca-api/actions/runs/ID_DA_EXECUCAO |
| Desempenho (p95 medido) | [`docs/desempenho.md`](docs/desempenho.md) |
| Time | [`CONTRIBUTORS.md`](CONTRIBUTORS.md) |
| Roteiro de apresentação | [`docs/roteiro-apresentacao.md`](docs/roteiro-apresentacao.md) |

## Nível escolhido

**Nível simples: API de domínio único.**

- Um único domínio (biblioteca), sem decomposição em módulos e sem exigência de volume.
- *Simples não é incompleto*: o fluxo principal funciona de verdade, de ponta a ponta, com regras de negócio, validação, erros tratados, testes, CI, observabilidade e contrato OpenAPI.
- Fora do escopo, por decisão consciente: banco de dados real, autenticação e paginação (ver "Limitações" e o [ADR 0001](docs/adr/0001-decisao.md)).

## Como subir

Pré-requisito: Docker com Compose v2.

```bash
docker compose up --build
```

Pronto. Confira:

| O quê | Onde |
|---|---|
| Healthcheck | http://localhost:3000/health |
| Swagger UI (documentação interativa) | http://localhost:3000/docs |
| Contrato OpenAPI (JSON) | http://localhost:3000/openapi.json |
| Métricas Prometheus | http://localhost:3000/metrics |

Sem Docker (Node 20+):

```bash
cp .env.example .env
npm install        # gera o package-lock.json: versione-o, o CI usa npm ci
npm run dev
```

### Experimente o fluxo principal

```bash
BOOK=$(curl -s -X POST localhost:3000/books -H 'content-type: application/json' \
  -d '{"title":"Dom Casmurro","author":"Machado de Assis","copies":1}' | jq -r .id)

LOAN=$(curl -s -X POST localhost:3000/loans -H 'content-type: application/json' \
  -d "{\"bookId\":\"$BOOK\",\"borrower\":\"Ana\"}" | jq -r .id)

# segundo empréstimo do mesmo livro: 409 (sem exemplares)
curl -s -X POST localhost:3000/loans -H 'content-type: application/json' \
  -d "{\"bookId\":\"$BOOK\",\"borrower\":\"Bia\"}"

# devolve: o estoque volta
curl -s -X POST localhost:3000/loans/$LOAN/return
```

## Como testar

```bash
npm install
npm test                # unitários (domínio, serviço, config) + integração (Supertest)
npm run test:coverage   # com cobertura; falha se ficar abaixo do mínimo
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
npm run lint:openapi    # Spectral valida docs/openapi.yaml
```

Smoke de desempenho (k6), com a API no ar:

```bash
docker compose up -d --build
docker compose --profile smoke run --rm k6
```

**Coverage mínimo declarado:** 80% linhas, statements e funções; 70% branches (`vitest.config.ts`). `src/server.ts` (bootstrap) fica fora da conta.

**CI** (`.github/workflows/ci.yml`): install → lint → typecheck → lint OpenAPI → testes com cobertura → build, mais um job de varredura de segredos (gitleaks).

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/books` | Cadastra livro |
| GET | `/books`, `/books/{id}` | Lista / busca |
| POST | `/loans` | Empresta (baixa estoque) |
| GET | `/loans/{id}` | Consulta empréstimo |
| POST | `/loans/{id}/return` | Devolve (repõe estoque) |
| GET | `/health`, `/metrics`, `/docs`, `/openapi.json` | Operação e contrato |

Contrato completo: [`docs/openapi.yaml`](docs/openapi.yaml).

## Arquitetura

```
src/
├─ domain/        Book, Loan e erros (regras de negócio, sem I/O)
├─ application/   LibraryService (casos de uso) e portas (interfaces)
├─ infra/         Adaptadores: repositórios em memória, relógio, ids
└─ http/          Rotas, validação (zod) e tratamento de erros
```

- **SOLID:** regras no domínio (S); serviço depende de interfaces (D); novos adaptadores sem alterar o serviço (O).
- **Pattern justificado:** Repository, ver [ADR 0001](docs/adr/0001-decisao.md).
- Contexto C4: [`docs/c4/contexto.md`](docs/c4/contexto.md).

## Operação

- **Config:** variáveis em `.env` (modelo em `.env.example`). Segredos nunca entram no repositório; o CI roda gitleaks.
- **Logs:** JSON estruturado (pino) com `requestId`, rota, status e duração.
- **Métrica:** `http_request_duration_seconds` em `/metrics`.
- **SLO:** p95 < 300 ms e >= 99% sem 5xx. Detalhes e números em [`docs/desempenho.md`](docs/desempenho.md).

## Limitações

Os dados ficam em memória: reiniciar apaga tudo e só há uma instância. É uma decisão consciente (ADR 0001); o próximo passo natural é um adaptador Postgres.
