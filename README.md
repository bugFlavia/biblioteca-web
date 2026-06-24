# Biblioteca — Testes de Lançamento (Cypress + TypeScript + CI/CD)

Implementação **exata** da especificação de engenharia (RF01–RF10,
RNF01–RNF07 e os 5 cenários de teste), com testes de lançamento
automatizados e pipeline de CI/CD. Veja a rastreabilidade em
[REQUISITOS.md](REQUISITOS.md).

## Estrutura

```
biblioteca-web/
├─ index.html                  # UI (com painel "Registro de operações")
├─ src/
│  ├─ biblioteca.ts            # domínio: RF01..RF10 + integridade
│  └─ main.ts                  # UI + persistência (RNF06)
├─ cypress/e2e/
│  ├─ cenarios.cy.ts           # Cenários 1 a 5
│  └─ requisitos.cy.ts         # RF + RNF testáveis por E2E
├─ perf/desempenho.ts          # testes de desempenho/escalabilidade (RNF01/04/07)
├─ verificar-logica.ts         # verificação rápida da lógica (sem navegador)
└─ .github/workflows/ci.yml    # pipeline CI/CD (gate de lançamento)
```

## Como testar

```bash
npm install                                         # uma vez

# 1) Lógica de domínio (RF/RNF) — rápido, sem navegador
node --experimental-strip-types verificar-logica.ts

# 2) Desempenho / escalabilidade (RNF01, RNF04, RNF07)
node --experimental-strip-types perf/desempenho.ts

# 3) Testes E2E (cenários + requisitos) — VISUAL
npm run dev          # em um terminal
npm run cy:open      # em outro: escolha E2E e veja rodando

# 4) Testes E2E em modo headless (igual ao CI)
npm run build
npm run test:e2e
```

## Identificar o que está sendo executado

- **Terminal:** cada teste Cypress imprime cenário + passos + resultado esperado.
- **Tela do app:** painel *Registro de operações* mostra o RF/RNF de cada ação.
- **Scripts de domínio:** cada checagem traz o prefixo `[RFxx]` / `[RNFxx]`.

## CI/CD

A cada push/PR, o GitHub Actions roda: typecheck → build → lógica → desempenho
→ Cypress E2E. O job `deploy` só executa se **todos** passarem (`needs:`),
ou seja: **a versão só é publicada se passar nos testes de lançamento.**
```yaml
deploy:
  needs: testes-de-lancamento   # gate de qualidade
```
