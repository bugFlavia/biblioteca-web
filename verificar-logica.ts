// Verificação da lógica de domínio (sem navegador), cobrindo RF01..RF10 e
// os RNF testáveis na regra de negócio. Prova que as asserções dos specs
// Cypress passariam. Rodar: node --experimental-strip-types verificar-logica.ts
import {
  Biblioteca,
  NaoAutenticado,
  LivroIndisponivel,
} from "./src/biblioteca.ts";

let ok = 0;
let fail = 0;
function check(req: string, nome: string, cond: boolean) {
  if (cond) {
    ok++;
    console.log(`  ✅ [${req}] ${nome}`);
  } else {
    fail++;
    console.log(`  ❌ [${req}] ${nome}`);
  }
}
function nova() {
  const b = new Biblioteca();
  b.cadastrarUsuario("u1", "Ana"); // RF01
  b.cadastrarUsuario("u2", "Bruno");
  b.cadastrarLivro("L1", "Sommerville", 2); // RF02
  b.cadastrarLivro("L2", "Clean Code", 1);
  b.cadastrarLivro("L3", "Pragmático", 3);
  return b;
}

console.log("RF01/RF02 — cadastros e acervo");
{
  const b = nova();
  check("RF03", "disponibilidade de L3 = 3", b.consultarDisponibilidade("L3") === 3);
  check("RF02", "atualização do acervo (L2 -> 4)", b.atualizarLivro("L2", { total: 4 }).disponivel === 4);
}

console.log("RNF03 — segurança");
{
  const b = nova();
  let bloqueou = false;
  try { b.realizarEmprestimo("L1", "2026-06-24"); } catch (e) { bloqueou = e instanceof NaoAutenticado; }
  check("RNF03", "empréstimo sem login é bloqueado", bloqueou);
}

console.log("RF04/RF06 — empréstimo e quantidade");
{
  const b = nova();
  b.login("u1");
  const e = b.realizarEmprestimo("L2", "2026-06-24");
  check("RF04", "empréstimo criado com prazo +14d", e.dataPrevista === "2026-07-08");
  check("RF06", "disponível de L2 caiu para 0", b.consultarDisponibilidade("L2") === 0);
}

console.log("Cenário 2 / RNF04 — indisponibilidade e integridade");
{
  const b = nova();
  b.login("u1");
  b.realizarEmprestimo("L2", "2026-06-24"); // único exemplar
  let bloqueou = false;
  try { b.realizarEmprestimo("L2", "2026-06-24"); } catch (e) { bloqueou = e instanceof LivroIndisponivel; }
  check("RNF04", "segundo empréstimo do mesmo exemplar é bloqueado", bloqueou);
  check("RNF04", "disponível nunca negativo", b.consultarDisponibilidade("L2") === 0);
}

console.log("RF05/RF08/RF09 — devolução, atraso e multa");
{
  const b = nova();
  b.login("u1");
  const e1 = b.realizarEmprestimo("L1", "2026-06-24");
  const d1 = b.registrarDevolucao(e1.id, "2026-07-08"); // no prazo
  check("RF08", "sem atraso => 0 dias", d1.diasAtraso === 0);
  check("RF09", "sem atraso => multa 0", d1.multa === 0);
  check("RF06", "exemplar reposto (L1 volta a 2)", b.consultarDisponibilidade("L1") === 2);

  const e2 = b.realizarEmprestimo("L1", "2026-06-24");
  const d2 = b.registrarDevolucao(e2.id, "2026-07-13"); // 5 dias de atraso
  check("RF08", "5 dias de atraso detectados", d2.diasAtraso === 5);
  check("RF09", "multa = R$ 5,00", d2.multa === 5);
}

console.log("RF07 — empréstimos ativos");
{
  const b = nova();
  b.login("u1");
  b.realizarEmprestimo("L1", "2026-06-24");
  b.realizarEmprestimo("L3", "2026-06-24");
  check("RF07", "u1 possui 2 empréstimos ativos", b.emprestimosAtivos("u1").length === 2);
}

console.log("RF10 — relatórios");
{
  const b = nova();
  b.login("u1");
  b.realizarEmprestimo("L1", "2026-06-24");
  b.realizarEmprestimo("L3", "2026-06-24");
  const e = b.realizarEmprestimo("L1", "2026-06-24");
  b.registrarDevolucao(e.id, "2026-07-13");
  const r = b.relatorios();
  check("RF10", "total de empréstimos = 3", r.totalEmprestimos === 3);
  check("RF10", "total de devoluções = 1", r.totalDevolucoes === 1);
  check("RF10", "livro mais utilizado = L1", r.livrosMaisUtilizados[0].codigo === "L1");
}

console.log("RNF06 — persistência (serialização)");
{
  const b = nova();
  b.login("u1");
  b.realizarEmprestimo("L1", "2026-06-24");
  const copia = Biblioteca.fromJSON(b.toJSON());
  check("RNF06", "empréstimo preservado após serializar", copia.emprestimosAtivos("u1").length === 1);
}

console.log(`\nResultado: ${ok} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
