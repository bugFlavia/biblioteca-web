import { defineConfig } from "vite";

export default defineConfig({
  // Build estático simples (SPA). O `preview` serve a pasta dist na porta 4173,
  // que é o alvo dos testes de lançamento do Cypress no pipeline de CI/CD.
  build: {
    outDir: "dist",
  },
});
