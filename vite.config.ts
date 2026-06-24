import { defineConfig } from "vite";

export default defineConfig({
  // Build estático simples (SPA). Tanto o servidor de desenvolvimento (dev)
  // quanto o de preview usam a porta 4173 — a mesma do baseUrl do Cypress.
  build: {
    outDir: "dist",
  },
  // strictPort: se a 4173 estiver ocupada, falha avisando — em vez de pular
  // para outra porta e quebrar o baseUrl do Cypress silenciosamente.
  server: { port: 4173, strictPort: true }, // npm run dev  -> http://localhost:4173
  preview: { port: 4173, strictPort: true }, // npm run preview -> http://localhost:4173
});
