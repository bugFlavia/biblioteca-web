# Sistema de Biblioteca – Requisitos e Rastreabilidade dos Testes

Este documento liga a especificação de engenharia aos testes que a validam
(rastreabilidade requisito → teste). É a base dos **testes de lançamento**.

## Requisitos Funcionais

| ID   | Requisito                          | Onde é testado |
|------|------------------------------------|----------------|
| RF01 | Cadastro de usuários               | `verificar-logica.ts` |
| RF02 | Cadastro/atualização de livros     | `requisitos.cy.ts` (RF02) + lógica |
| RF03 | Consulta de disponibilidade        | `requisitos.cy.ts` (RF03) |
| RF04 | Realização de empréstimo           | `requisitos.cy.ts` (RF04) + Cenário 1 |
| RF05 | Registro de devolução              | `requisitos.cy.ts` (RF05/RF06) + Cenário 3 |
| RF06 | Controle de quantidade             | `requisitos.cy.ts` (RF05/RF06) |
| RF07 | Consulta de empréstimos ativos     | `requisitos.cy.ts` (RF07) + Cenário 5 |
| RF08 | Cálculo de atraso                  | `requisitos.cy.ts` (RF08/RF09) + Cenário 4 |
| RF09 | Aplicação de multa                 | `requisitos.cy.ts` (RF08/RF09) + Cenário 4 |
| RF10 | Emissão de relatórios              | `requisitos.cy.ts` (RF10) |

## Requisitos Não Funcionais

| ID    | Requisito                | Como é testado |
|-------|--------------------------|----------------|
| RNF01 | Desempenho (consulta <2s) | `requisitos.cy.ts` + `perf/desempenho.ts` |
| RNF02 | Disponibilidade 99%       | Não testável em demo — exigiria monitoramento em produção (uptime). |
| RNF03 | Segurança (autenticação)  | `requisitos.cy.ts` (RNF03) |
| RNF04 | Integridade dos dados     | `requisitos.cy.ts` (RNF04) + `perf/desempenho.ts` |
| RNF05 | Usabilidade (≤3 etapas)   | `requisitos.cy.ts` (RNF05) |
| RNF06 | Confiabilidade (sem perda)| `requisitos.cy.ts` (RNF06 — recarrega a página) |
| RNF07 | Escalabilidade (500 users)| `perf/desempenho.ts` (simulação) |

> **Observação honesta sobre RNF02 e RNF07:** disponibilidade de 99% só se
> comprova com monitoramento em produção; e 500 usuários *realmente
> simultâneos* se testam com ferramentas de carga (k6, Artillery, JMeter).
> Aqui, RNF07 é **simulado** no domínio (500 empréstimos sequenciais medidos)
> para demonstrar o conceito dentro do escopo do trabalho.

## Cenários de teste (fluxos completos)

| Cenário | Arquivo |
|---------|---------|
| 1 — Empréstimo de livro disponível        | `cenarios.cy.ts` |
| 2 — Empréstimo de livro indisponível       | `cenarios.cy.ts` |
| 3 — Devolução dentro do prazo              | `cenarios.cy.ts` |
| 4 — Devolução com atraso                   | `cenarios.cy.ts` |
| 5 — Consulta de empréstimos ativos         | `cenarios.cy.ts` |

## Como identificar o que está sendo executado

- **No terminal** (modo `cypress run`): cada teste imprime o cenário, os passos
  numerados e o resultado esperado, via `cy.task('log')`.
- **Na tela do app:** o painel *"Registro de operações"* mostra, a cada ação,
  qual requisito (RF/RNF) acabou de ser executado.
- **Nos scripts de domínio/desempenho:** cada verificação é prefixada com o
  `[RFxx]`/`[RNFxx]` correspondente.
