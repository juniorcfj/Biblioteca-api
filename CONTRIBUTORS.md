# Contributors

| Nome | GitHub | Papel / contribuições |
|---|---|---|
| Itamar Junior | [@juniorcfj](https://github.com/juniorcfj) | Autoria geral: domínio, API, testes, CI, observabilidade e documentação |

## Como contribuir

1. Crie uma branch a partir de `main`.
2. Rode `npm run lint && npm run typecheck && npm run test:coverage` antes de abrir o PR.
3. Se mudar um endpoint, atualize `docs/openapi.yaml` e rode `npm run lint:openapi`.
4. Se tomar uma decisão arquitetural, registre um novo ADR em `docs/adr/`.
5. O PR só é mesclado com o CI verde.
