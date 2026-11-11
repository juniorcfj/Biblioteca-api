# ADR 0001: Repository (portas e adaptadores) com persistência em memória

* Status: aceito
* Data: 2026-11-11

## Contexto e problema

A API tem um domínio único (livros e empréstimos) e precisa de um fluxo principal funcionando de ponta a ponta, com testes unitários do domínio rápidos e sem infraestrutura externa. Ainda não há exigência de volume nem de durabilidade. Precisamos decidir como o código de negócio acessa os dados sem se acoplar a uma tecnologia de armazenamento.

## Direcionadores

* Testes unitários do domínio sem banco, rodando em milissegundos.
* Compose que sobe com 1 comando e sem dependências extras.
* SOLID, em especial inversão de dependência (D) e responsabilidade única (S).
* Possibilidade de trocar o armazenamento depois sem reescrever regras de negócio.

## Alternativas consideradas

1. **Repository com interface (porta) e implementação em memória (escolhida).**
2. Usar `Map` direto dentro do serviço (sem pattern).
3. Postgres desde já, com ORM.

## Decisão

Adotamos o pattern **Repository**: `BookRepository` e `LoanRepository` são interfaces em `src/application/ports.ts`. O `LibraryService` depende só delas (e de `Clock`/`IdGenerator`, também portas). A implementação atual, `src/infra/in-memory-repositories.ts`, guarda *snapshots* dos agregados. A escolha das implementações concretas acontece em um único lugar, o composition root (`buildApp`).

## Consequências

* Positivo: o domínio e o serviço são testáveis sem I/O, com relógio e ids determinísticos.
* Positivo: trocar para Postgres significa escrever um novo adaptador, sem mexer em domínio ou rotas.
* Positivo: a alternativa 2 acoplaria regra de negócio ao armazenamento, e a 3 adicionaria infraestrutura sem necessidade agora.
* Negativo: os dados se perdem ao reiniciar o processo, e só funciona com uma instância.
* Negativo: a consistência de `lend` depende de o Node ser single-thread e de não haver `await` entre a checagem e a baixa de estoque. Com banco real será preciso transação ou lock otimista.
* Revisitar esta decisão quando houver necessidade de durabilidade ou de mais de uma réplica.
