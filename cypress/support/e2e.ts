// Comandos de suporte do Cypress.
// Servem para IDENTIFICAR durante a execução qual cenário/etapa está rodando:
//  - na UI do Cypress (cy.log)
//  - no terminal, em modo headless (cy.task('log'))

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      cenario(titulo: string): Chainable<void>;
      passo(n: number, descricao: string): Chainable<void>;
      esperado(descricao: string): Chainable<void>;
      login(usuarioId: string): Chainable<void>;
      setHoje(iso: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("cenario", (titulo: string) => {
  const linha = `\n=== ${titulo} ===`;
  cy.task("log", linha);
  cy.log(`**${titulo}**`);
});

Cypress.Commands.add("passo", (n: number, descricao: string) => {
  const linha = `  [Passo ${n}] ${descricao}`;
  cy.task("log", linha);
  cy.log(`Passo ${n}: ${descricao}`);
});

Cypress.Commands.add("esperado", (descricao: string) => {
  const linha = `  -> RESULTADO ESPERADO: ${descricao}`;
  cy.task("log", linha);
  cy.log(`Esperado: ${descricao}`);
});

Cypress.Commands.add("login", (usuarioId: string) => {
  cy.get("[data-cy=select-usuario]").select(usuarioId);
  cy.get("[data-cy=btn-login]").click();
});

Cypress.Commands.add("setHoje", (iso: string) => {
  cy.get("[data-cy=hoje]").clear().type(iso);
});

export {};
