// Comandos de suporte do Cypress.
// Servem para IDENTIFICAR durante a execução qual cenário/etapa está rodando:
//  - na UI do Cypress (cy.log)
//  - no terminal, em modo headless (cy.task('log'))
Cypress.Commands.add("cenario", (titulo) => {
    const linha = `\n=== ${titulo} ===`;
    cy.task("log", linha);
    cy.log(`**${titulo}**`);
});
Cypress.Commands.add("passo", (n, descricao) => {
    const linha = `  [Passo ${n}] ${descricao}`;
    cy.task("log", linha);
    cy.log(`Passo ${n}: ${descricao}`);
});
Cypress.Commands.add("esperado", (descricao) => {
    const linha = `  -> RESULTADO ESPERADO: ${descricao}`;
    cy.task("log", linha);
    cy.log(`Esperado: ${descricao}`);
});
Cypress.Commands.add("login", (usuarioId) => {
    cy.get("[data-cy=select-usuario]").select(usuarioId);
    cy.get("[data-cy=btn-login]").click();
});
Cypress.Commands.add("setHoje", (iso) => {
    cy.get("[data-cy=hoje]").clear().type(iso);
});
export {};
