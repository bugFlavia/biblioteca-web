// TESTES DE DESEMPENHO / ESCALABILIDADE (RNF01, RNF04, RNF07).
// Simula carga sobre o domínio e mede tempos, deixando explícito o que está
// sendo verificado a cada etapa.
//   Rodar: node --experimental-strip-types perf/desempenho.ts
import { Biblioteca } from "../src/biblioteca.ts";

function ms(t: number) {
  return `${t.toFixed(1)} ms`;
}
const resultados: { req: string; descricao: string; ok: boolean; detalhe: string }[] = [];
function checar(req: string, descricao: string, ok: boolean, detalhe: string) {
  resultados.push({ req, descricao, ok, detalhe });
  console.log(`  ${ok ? "✅" : "❌"} [${req}] ${descricao} — ${detalhe}`);
}

const bib = new Biblioteca();

// ---- Massa de dados: 500 usuários e 1000 livros -----------------------------
console.log("Preparando massa de dados (RNF07: 500 usuários)...");
for (let i = 1; i <= 500; i++) bib.cadastrarUsuario(`u${i}`, `Usuário ${i}`);
for (let i = 1; i <= 1000; i++) bib.cadastrarLivro(`L${i}`, `Livro número ${i}`, 5);

// ---- RNF01: consulta deve responder em até 2 s ------------------------------
console.log("\nRNF01 — Desempenho das consultas");
{
  const inicio = performance.now();
  for (let i = 0; i < 1000; i++) bib.pesquisar("Livro");
  const total = performance.now() - inicio;
  const media = total / 1000;
  checar("RNF01", "1000 consultas, cada uma < 2000 ms", media < 2000, `média ${ms(media)}`);
}

// ---- RNF07: 500 usuários realizando empréstimos "simultâneos" ---------------
console.log("\nRNF07 — Escalabilidade (500 usuários emprestando)");
{
  const inicio = performance.now();
  let sucesso = 0;
  for (let i = 1; i <= 500; i++) {
    bib.login(`u${i}`);
    bib.realizarEmprestimo(`L${i}`, "2026-06-24"); // cada um pega um livro diferente
    sucesso++;
  }
  const total = performance.now() - inicio;
  checar("RNF07", "500 empréstimos concluídos", sucesso === 500, `em ${ms(total)} (${(500 / (total / 1000)).toFixed(0)}/s)`);
}

// ---- RNF04: integridade sob concorrência ------------------------------------
// 50 usuários tentam pegar o MESMO livro que tem só 10 exemplares.
console.log("\nRNF04 — Integridade (10 exemplares, 50 tentativas)");
{
  bib.cadastrarLivro("DISPUTADO", "Livro Disputado", 10);
  let aceitos = 0;
  let rejeitados = 0;
  for (let i = 1; i <= 50; i++) {
    bib.login(`u${i}`);
    try {
      bib.realizarEmprestimo("DISPUTADO", "2026-06-24");
      aceitos++;
    } catch {
      rejeitados++;
    }
  }
  const disponivel = bib.consultarDisponibilidade("DISPUTADO");
  checar("RNF04", "exatamente 10 empréstimos aceitos", aceitos === 10, `aceitos=${aceitos}, rejeitados=${rejeitados}`);
  checar("RNF04", "disponibilidade nunca fica negativa", disponivel === 0, `disponível=${disponivel}`);
}

const falhas = resultados.filter((r) => !r.ok).length;
console.log(`\nResultado dos testes de desempenho: ${resultados.length - falhas} ok, ${falhas} falha(s)`);
if (falhas > 0) process.exit(1);
