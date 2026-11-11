# Desempenho, métrica e SLO

## Contexto

API de domínio único com persistência em memória. O objetivo aqui é ter **um número medido** (p95) do fluxo principal e compará-lo com um SLO simples, não simular produção.

## Métrica

`http_request_duration_seconds`: histograma Prometheus com labels `method`, `route` e `status`, exposto em `GET /metrics`. Buckets de 5 ms a 2,5 s, para resolver bem a região de 300 ms do SLO.

## SLO

| Indicador | Objetivo | Janela |
|---|---|---|
| Latência: p95 das requisições do fluxo principal | **< 300 ms** | 30 dias |
| Disponibilidade: requisições sem 5xx | **>= 99%** | 30 dias |

```promql
# p95 de latência (5 min)
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))

# taxa de erro 5xx
sum(rate(http_request_duration_seconds_count{status=~"5.."}[5m]))
  / sum(rate(http_request_duration_seconds_count[5m]))
```

## Como medir (smoke k6)

Cenário `tests/k6/smoke.js`: 5 usuários virtuais por 20 s, cada iteração faz cadastrar livro, emprestar e devolver. Os *thresholds* do script já codificam o SLO (`p(95)<300` e `http_req_failed<1%`): se falhar, o k6 sai com código diferente de zero.

```bash
docker compose up -d --build
docker compose --profile smoke run --rm k6
# alternativa com k6 instalado, exportando o resumo:
# k6 run --summary-export=docs/k6-summary.json tests/k6/smoke.js
```

## Resultado medido

> Preencher com a saída real do k6 (campos `http_req_duration` e `http_reqs`). Não estimar.

| Campo | Valor |
|---|---|
| Data | AAAA-MM-DD |
| Ambiente | _ex.: Docker Desktop, 8 GB, notebook_ |
| Requisições totais | _?_ |
| Vazão (req/s) | _?_ |
| p50 / p90 / **p95** / máx | _? / ? / **?** / ? ms_ |
| Taxa de erro | _?%_ |
| Thresholds | _passou / falhou_ |
| Cobertura de testes (`npm run test:coverage`) | _?% linhas, ?% branches_ |

**Leitura:** _uma ou duas frases: o p95 ficou abaixo ou acima dos 300 ms? Há folga?_

## Limites desta medição

- Roda na mesma máquina do gerador de carga, então competem por CPU.
- Persistência em memória: não representa a latência de um banco real.
- 20 s e 5 VUs é *smoke*, não teste de carga: detecta regressão grosseira, não capacidade.

## O que eu faria diferente

1. Repetir a medição com Postgres (o novo gargalo provável) e comparar com este baseline.
2. Aumentar a duração e rodar em CI como etapa opcional, guardando o p95 como artefato.
3. Medir o SLO com Prometheus real e alerta de *burn rate*, em vez de olhar só o resumo do k6.
