// TESTES DE LANÇAMENTO — Cenários de teste (Engenharia).
// Cada teste imprime, durante a execução, o cenário, os passos e o resultado
// esperado (no terminal via cy.task('log') e na UI do Cypress via cy.log).

describe("Cenários de teste — Empréstimo e Devolução", () => {
  beforeEach(() => {
    cy.clearLocalStorage(); // estado limpo a cada teste
    cy.visit("/");
    cy.setHoje("2026-06-24");
  });

  it("Cenário 1 — Empréstimo de Livro Disponível", () => {
    cy.cenario("Cenário 1 — Empréstimo de Livro Disponível");

    cy.passo(1, "Usuário realiza login");
    cy.login("u1");

    cy.passo(2, "Pesquisa o livro");
    cy.get("[data-cy=busca]").type("Clean Code");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=resultado] [data-cy=disp]").should("have.text", "1");

    cy.passo(3, 'Seleciona "Realizar Empréstimo" — sistema registra');
    cy.get("[data-cy=btn-emprestar]").click();

    cy.esperado("Empréstimo registrado; disponível reduzido; data de devolução informada");
    cy.get("[data-cy=mensagem]")
      .should("have.attr", "data-tipo", "ok")
      .and("contain", "Devolver até 2026-07-08");
    cy.get("[data-cy=resultado] [data-cy=disp]").should("have.text", "0"); // RF06
  });

  it("Cenário 2 — Tentativa de Empréstimo de Livro Indisponível", () => {
    cy.cenario("Cenário 2 — Empréstimo de Livro Indisponível");
    cy.login("u1");

    cy.passo(1, "Esgota o único exemplar de Clean Code");
    cy.get("[data-cy=busca]").type("Clean Code");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=btn-emprestar]").click(); // disponível 1 -> 0

    cy.passo(2, "Solicita empréstimo novamente (sem exemplares)");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=btn-emprestar]").click();

    cy.esperado("Operação bloqueada com mensagem de indisponibilidade");
    cy.get("[data-cy=mensagem]")
      .should("have.attr", "data-tipo", "erro")
      .and("contain", "Não há exemplares");
  });

  it("Cenário 3 — Devolução Dentro do Prazo", () => {
    cy.cenario("Cenário 3 — Devolução Dentro do Prazo");
    cy.login("u1");
    cy.get("[data-cy=busca]").type("Sommerville");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=btn-emprestar]").click();

    cy.passo(1, "Bibliotecário localiza o empréstimo");
    cy.get("[data-cy=btn-meus-emprestimos]").click();

    cy.passo(2, "Registra a devolução dentro do prazo (mesma data)");
    cy.get("[data-cy=btn-devolver]").first().click();

    cy.esperado("Empréstimo encerrado, exemplar retorna ao estoque, sem multa");
    cy.get("[data-cy=mensagem]").should("contain", "Sem multa");
    cy.get("[data-cy=meu-emprestimo]").should("not.exist");
  });

  it("Cenário 4 — Devolução com Atraso", () => {
    cy.cenario("Cenário 4 — Devolução com Atraso");
    cy.login("u1");
    cy.get("[data-cy=busca]").type("Sommerville");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=btn-emprestar]").click(); // prazo 2026-07-08

    cy.passo(1, "Avança a data para 5 dias após o prazo e devolve");
    cy.setHoje("2026-07-13");
    cy.get("[data-cy=btn-meus-emprestimos]").click();
    cy.get("[data-cy=btn-devolver]").first().click();

    cy.passo(2, "Sistema calcula os dias de atraso e a multa");
    cy.esperado("Multa de R$ 5,00 (5 dias x R$ 1,00) exibida; empréstimo encerrado");
    cy.get("[data-cy=mensagem]")
      .should("contain", "5 dia")
      .and("contain", "R$ 5.00");
  });

  it("Cenário 5 — Consulta de Empréstimos Ativos", () => {
    cy.cenario("Cenário 5 — Consulta de Empréstimos Ativos");

    cy.passo(1, "Usuário realiza login");
    cy.login("u1");

    // pré-condição: usuário possui empréstimos ativos
    cy.get("[data-cy=busca]").type("O Programador");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=btn-emprestar]").click();

    cy.passo(2, 'Acessa a área "Meus Empréstimos"');
    cy.get("[data-cy=btn-meus-emprestimos]").click();

    cy.esperado("Sistema exibe os livros emprestados e as datas de devolução");
    cy.get("[data-cy=meu-emprestimo]").should("have.length", 1);
    cy.get("[data-cy=meu-emprestimo] [data-cy=prazo]").should("have.text", "2026-07-08");
  });
});
