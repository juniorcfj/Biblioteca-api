# Roteiro de apresentação (10 min)

| Tempo | O que mostrar |
|---|---|
| 1 min | O problema e o nível escolhido |
| 3 min | Demonstração: sobe, roda, responde |
| 3 min | Uma decisão técnica e a alternativa descartada |
| 3 min | Números e o que faria diferente |

---

## 1 min: o problema e o nível escolhido

**Mostrar:** README (seção "Nível escolhido") e o diagrama de `docs/c4/contexto.md`.

**Falar:**
- Problema: controlar empréstimo de livros sem emprestar o que não existe e sem devolver duas vezes.
- Nível: **simples, domínio único**. Um sistema, um fluxo, sem módulos.
- Frase-âncora: "simples não é incompleto". O fluxo roda de verdade, e há testes, CI, métrica, SLO e contrato.

## 3 min: demonstração (sobe, roda, responde)

**Preparar antes:** `docker compose down`, terminal limpo, aba do navegador pronta.

1. **Sobe (30 s):** `docker compose up --build`. Mostre que é um comando só.
2. **Roda (30 s):** abra `http://localhost:3000/docs` (Swagger UI gerado do `openapi.yaml`).
3. **Responde (2 min):** execute o fluxo pelo Swagger ou pelo `curl` do README:
   - `POST /books` com `copies: 1` → 201.
   - `POST /loans` → 201 (`status: ACTIVE`).
   - `POST /loans` de novo → **409** `NO_COPIES_AVAILABLE` (mostra a regra de negócio).
   - `POST /loans/{id}/return` → 200 (`RETURNED`).
   - `POST /loans/{id}/return` de novo → **409** `LOAN_ALREADY_RETURNED`.
   - Rápido: `GET /metrics` mostrando `library_loans_created_total` e o histograma; um log JSON no terminal com `requestId`.

**Plano B:** se o Docker falhar, `npm run dev`. Se tudo falhar, mostre a execução verde do CI e os testes de integração, que fazem exatamente esse fluxo.

## 3 min: uma decisão técnica e a alternativa descartada

**Mostrar:** `docs/adr/0001-decisao.md` e `src/application/ports.ts`.

**Decisão:** pattern **Repository**. O serviço depende de interfaces (`BookRepository`, `LoanRepository`, `Clock`, `IdGenerator`), e a implementação em memória fica em `infra/`.

**Alternativas descartadas:**
- *`Map` direto no serviço*: mais rápido de escrever, mas mistura regra de negócio com armazenamento e dificulta trocar depois.
- *Postgres desde já*: dá durabilidade, mas adiciona infraestrutura sem exigência de volume ou persistência neste nível.

**Prova de que valeu a pena:** os testes unitários rodam em milissegundos, sem banco, com relógio e ids falsos (mostre `tests/helpers.ts`).

**Custo assumido (diga em voz alta):** os dados somem ao reiniciar, e a consistência do estoque depende de o Node ser single-thread. Com banco real, precisa de transação ou lock otimista.

## 3 min: números e o que faria diferente

**Mostrar:** `docs/desempenho.md` (resultado do k6) e o CI verde.

**Números a citar** (preencha com os reais antes de apresentar):
- p95 medido: **___ ms** contra SLO de 300 ms.
- Taxa de erro: ___%.
- Cobertura: ___% linhas (mínimo declarado 80%).
- CI: install, lint, typecheck, OpenAPI, testes com cobertura e build verdes, mais gitleaks.

**O que faria diferente:**
1. Adaptador Postgres com transação ou lock otimista no empréstimo, e repetir o k6 para comparar.
2. Autenticação, paginação e idempotência no `POST /loans`.
3. Rodar o k6 no CI guardando o p95 como artefato, e medir o SLO com Prometheus e alerta.
4. Publicar a imagem Docker e fazer deploy automatizado.

---

## Perguntas prováveis

- **Por que não usou banco?** Decisão registrada no ADR: nível simples, sem exigência de volume. O Repository deixa a troca barata.
- **E se dois pedidos emprestarem o último exemplar ao mesmo tempo?** Hoje é seguro porque a checagem e a baixa acontecem sem `await` no meio, em um único processo. Com banco real, precisa de transação ou lock.
- **Como sabe que o contrato bate com a API?** Spectral valida o YAML no CI, e um teste de integração confere o `/openapi.json` servido.
- **O que o SLO muda na prática?** Dá um critério objetivo: o smoke k6 falha se o p95 passar de 300 ms.
