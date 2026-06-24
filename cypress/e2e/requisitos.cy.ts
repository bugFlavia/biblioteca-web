// TESTES DE LANÇAMENTO — baseados em requisitos.
// Um teste por requisito funcional + os requisitos não funcionais testáveis
// por E2E. O título de cada teste identifica o requisito em execução.

describe("Requisitos Funcionais (RF)", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit("/");
    cy.setHoje("2026-06-24");
  });

  it("RF02 — acervo cadastrado fica visível na pesquisa", () => {
    cy.cenario("RF02 — Cadastro de Livros");
    cy.get("[data-cy=busca]").type("Sommerville");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=resultado]").should("have.length", 1);
  });

  it("RF03 — consulta exibe a disponibilidade do livro", () => {
    cy.cenario("RF03 — Consulta de Disponibilidade");
    cy.get("[data-cy=busca]").type("O Programador");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=resultado] [data-cy=disp]").should("have.text", "3");
  });

  it("RF04 — empréstimo registrado com data prevista", () => {
    cy.cenario("RF04 — Realização de Empréstimo");
    cy.login("u1");
    cy.get("[data-cy=busca]").type("Sommerville");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=btn-emprestar]").click();
    cy.get("[data-cy=mensagem]").should("contain", "Devolver até 2026-07-08");
  });

  it("RF05 + RF06 — devolução encerra o empréstimo e repõe o exemplar", () => {
    cy.cenario("RF05/RF06 — Devolução e controle de quantidade");
    cy.login("u1");
    cy.get("[data-cy=busca]").type("Clean Code");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=btn-emprestar]").click();
    cy.get("[data-cy=resultado] [data-cy=disp]").should("have.text", "0"); // RF06 -1
    cy.get("[data-cy=btn-meus-emprestimos]").click();
    cy.get("[data-cy=btn-devolver]").first().click(); // RF05
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=resultado] [data-cy=disp]").should("have.text", "1"); // RF06 +1
  });

  it("RF07 — visualização dos empréstimos ativos do usuário", () => {
    cy.cenario("RF07 — Consulta de Empréstimos");
    cy.login("u1");
    cy.get("[data-cy=busca]").type("O Programador");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=btn-emprestar]").click();
    cy.get("[data-cy=btn-meus-emprestimos]").click();
    cy.get("[data-cy=meu-emprestimo]").should("have.length", 1);
  });

  it("RF08 + RF09 — atraso identificado e multa calculada", () => {
    cy.cenario("RF08/RF09 — Cálculo de atraso e multa");
    cy.login("u1");
    cy.get("[data-cy=busca]").type("Sommerville");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=btn-emprestar]").click();
    cy.setHoje("2026-07-11"); // 3 dias de atraso
    cy.get("[data-cy=btn-meus-emprestimos]").click();
    cy.get("[data-cy=btn-devolver]").first().click();
    cy.get("[data-cy=mensagem]").should("contain", "3 dia").and("contain", "R$ 3.00");
  });

  it("RF10 — relatório de empréstimos e livros mais utilizados", () => {
    cy.cenario("RF10 — Emissão de Relatórios");
    cy.login("u1");
    cy.get("[data-cy=busca]").type("Sommerville");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=btn-emprestar]").click();
    cy.get("[data-cy=btn-relatorio]").click();
    cy.get("[data-cy=relatorio]")
      .should("contain", "totalEmprestimos")
      .and("contain", "livrosMaisUtilizados");
  });
});

describe("Requisitos Não Funcionais (RNF) testáveis por E2E", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit("/");
    cy.setHoje("2026-06-24");
  });

  it("RNF01 — consulta de livros responde em até 2 segundos", () => {
    cy.cenario("RNF01 — Desempenho (consulta < 2s)");
    const inicio = performance.now();
    cy.get("[data-cy=busca]").type("Clean");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=resultado]").should("exist").then(() => {
      const ms = performance.now() - inicio;
      cy.task("log", `  -> consulta levou ${ms.toFixed(0)} ms`);
      expect(ms).to.be.lessThan(2000);
    });
  });

  it("RNF03 — empréstimo sem login é bloqueado", () => {
    cy.cenario("RNF03 — Segurança (somente autenticados)");
    cy.get("[data-cy=busca]").type("Sommerville");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=btn-emprestar]").click(); // sem login
    cy.get("[data-cy=mensagem]")
      .should("have.attr", "data-tipo", "erro")
      .and("contain", "autenticado");
  });

  it("RNF04 — mesmo exemplar não é emprestado duas vezes (integridade)", () => {
    cy.cenario("RNF04 — Integridade dos dados");
    cy.login("u1");
    cy.get("[data-cy=busca]").type("Clean Code"); // só 1 exemplar
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=btn-emprestar]").click(); // 1 -> 0
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=btn-emprestar]").click(); // bloqueado
    cy.get("[data-cy=mensagem]").should("contain", "Não há exemplares");
  });

  it("RNF05 — empréstimo concluído em no máximo 3 etapas", () => {
    cy.cenario("RNF05 — Usabilidade (<= 3 etapas)");
    let cliques = 0;
    const clicar = (sel: string) => {
      cliques++;
      cy.get(sel).click();
    };
    cy.login("u1"); // etapa de autenticação (pré-condição)
    cy.get("[data-cy=busca]").type("Sommerville");
    clicar("[data-cy=btn-buscar]"); // etapa 1
    clicar("[data-cy=btn-emprestar]"); // etapa 2
    cy.then(() => {
      cy.task("log", `  -> empréstimo concluído em ${cliques} etapas`);
      expect(cliques).to.be.at.most(3);
    });
    cy.get("[data-cy=mensagem]").should("have.attr", "data-tipo", "ok");
  });

  it("RNF06 — dados persistem após recarregar a página (sem perda)", () => {
    cy.cenario("RNF06 — Confiabilidade (persistência)");
    cy.login("u1");
    cy.get("[data-cy=busca]").type("Sommerville");
    cy.get("[data-cy=btn-buscar]").click();
    cy.get("[data-cy=btn-emprestar]").click();
    cy.reload(); // simula queda/reabertura
    cy.login("u1");
    cy.get("[data-cy=btn-meus-emprestimos]").click();
    cy.get("[data-cy=meu-emprestimo]").should("have.length", 1); // não se perdeu
  });
});
