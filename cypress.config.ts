import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:4173",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    video: false,
    setupNodeEvents(on) {
      // Task 'log': imprime no TERMINAL durante o `cypress run`, deixando
      // explícito qual requisito/etapa está sendo executado.
      on("task", {
        log(mensagem: string) {
          // eslint-disable-next-line no-console
          console.log(mensagem);
          return null;
        },
      });
    },
  },
});
