// =============================================================================
// Sistema de Biblioteca — Empréstimo e Devolução de Livros
// Implementa SOMENTE os requisitos especificados (RF01..RF10, RNF03/04/06).
// (Os demais RNF — desempenho, escalabilidade etc. — são exercitados pelos
//  testes de desempenho em perf/desempenho.ts.)
// =============================================================================

export const PRAZO_DIAS = 14;
export const MULTA_POR_DIA = 1.0; // R$ por dia de atraso (RF09)

// --- Erros de domínio --------------------------------------------------------
export class NaoAutenticado extends Error {} // RNF03
export class LivroIndisponivel extends Error {} // Cenário 2 / RF03
export class RegistroNaoEncontrado extends Error {}

// --- Entidades ---------------------------------------------------------------
export interface Usuario {
  id: string;
  nome: string;
}

export interface Livro {
  codigo: string;
  titulo: string;
  total: number; // total de exemplares no acervo
  disponivel: number; // exemplares disponíveis (RF06)
}

export interface Emprestimo {
  id: number;
  usuarioId: string;
  livroCodigo: string;
  dataEmprestimo: string; // YYYY-MM-DD
  dataPrevista: string; // YYYY-MM-DD
  dataDevolucao: string | null;
  diasAtraso: number; // RF08
  multa: number; // RF09
}

// --- Helpers de data ---------------------------------------------------------
function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function format(date: Date): string {
  return date.toISOString().slice(0, 10);
}
export function addDays(iso: string, dias: number): string {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return format(d);
}
function diffDays(isoA: string, isoB: string): number {
  return Math.round((parse(isoA).getTime() - parse(isoB).getTime()) / 86_400_000);
}

// --- Sistema (fachada) -------------------------------------------------------
export class Biblioteca {
  private usuarios = new Map<string, Usuario>();
  private livros = new Map<string, Livro>();
  private emprestimos: Emprestimo[] = [];
  private seq = 1;
  usuarioLogado: Usuario | null = null;

  // RF01 — Cadastro de Usuários
  cadastrarUsuario(id: string, nome: string): Usuario {
    const u: Usuario = { id, nome };
    this.usuarios.set(id, u);
    return u;
  }

  // RF02 — Cadastro e atualização do acervo de livros
  cadastrarLivro(codigo: string, titulo: string, quantidade: number): Livro {
    const l: Livro = { codigo, titulo, total: quantidade, disponivel: quantidade };
    this.livros.set(codigo, l);
    return l;
  }
  atualizarLivro(codigo: string, dados: { titulo?: string; total?: number }): Livro {
    const l = this.exigirLivro(codigo);
    if (dados.titulo !== undefined) l.titulo = dados.titulo;
    if (dados.total !== undefined) {
      const emprestados = l.total - l.disponivel;
      l.total = dados.total;
      l.disponivel = Math.max(0, dados.total - emprestados);
    }
    return l;
  }

  // RNF03 — Segurança: somente usuários autenticados operam o sistema
  login(usuarioId: string): Usuario {
    const u = this.usuarios.get(usuarioId);
    if (!u) throw new RegistroNaoEncontrado("Usuário não cadastrado");
    this.usuarioLogado = u;
    return u;
  }
  logout(): void {
    this.usuarioLogado = null;
  }
  private exigirLogin(): Usuario {
    if (!this.usuarioLogado)
      throw new NaoAutenticado("É necessário estar autenticado (RNF03)");
    return this.usuarioLogado;
  }

  // RF03 — Consulta de disponibilidade
  consultarDisponibilidade(codigo: string): number {
    return this.exigirLivro(codigo).disponivel;
  }
  pesquisar(termo: string): Livro[] {
    const t = termo.trim().toLowerCase();
    return [...this.livros.values()].filter(
      (l) => l.titulo.toLowerCase().includes(t) || l.codigo.toLowerCase() === t,
    );
  }

  // RF04 — Realização de empréstimo
  realizarEmprestimo(livroCodigo: string, hoje: string): Emprestimo {
    const usuario = this.exigirLogin(); // RNF03
    const livro = this.exigirLivro(livroCodigo);
    // RNF04 — integridade: nunca emprestar exemplar inexistente (Cenário 2)
    if (livro.disponivel <= 0)
      throw new LivroIndisponivel(`Não há exemplares de "${livro.titulo}"`);

    livro.disponivel -= 1; // RF06 — controle de quantidade
    const emp: Emprestimo = {
      id: this.seq++,
      usuarioId: usuario.id,
      livroCodigo,
      dataEmprestimo: hoje,
      dataPrevista: addDays(hoje, PRAZO_DIAS),
      dataDevolucao: null,
      diasAtraso: 0,
      multa: 0,
    };
    this.emprestimos.push(emp);
    return emp;
  }

  // RF05 — Registro de devolução (+ RF08 atraso, RF09 multa)
  registrarDevolucao(emprestimoId: number, dataDevolucao: string): Emprestimo {
    this.exigirLogin(); // RNF03
    const emp = this.emprestimos.find((e) => e.id === emprestimoId && !e.dataDevolucao);
    if (!emp) throw new RegistroNaoEncontrado("Empréstimo ativo não encontrado");

    emp.dataDevolucao = dataDevolucao;
    const atraso = diffDays(dataDevolucao, emp.dataPrevista); // RF08
    emp.diasAtraso = atraso > 0 ? atraso : 0;
    emp.multa = Math.round(emp.diasAtraso * MULTA_POR_DIA * 100) / 100; // RF09

    this.exigirLivro(emp.livroCodigo).disponivel += 1; // RF06
    return emp;
  }

  // RF07 — Consulta de empréstimos ativos de um usuário
  emprestimosAtivos(usuarioId: string): Emprestimo[] {
    return this.emprestimos.filter(
      (e) => e.usuarioId === usuarioId && !e.dataDevolucao,
    );
  }

  // RF10 — Emissão de relatórios
  relatorios(): {
    totalEmprestimos: number;
    totalDevolucoes: number;
    totalMultas: number;
    livrosMaisUtilizados: { codigo: string; titulo: string; vezes: number }[];
  } {
    const totalDevolucoes = this.emprestimos.filter((e) => e.dataDevolucao).length;
    const totalMultas = this.emprestimos.reduce((s, e) => s + e.multa, 0);
    const contagem = new Map<string, number>();
    for (const e of this.emprestimos)
      contagem.set(e.livroCodigo, (contagem.get(e.livroCodigo) ?? 0) + 1);
    const livrosMaisUtilizados = [...contagem.entries()]
      .map(([codigo, vezes]) => ({
        codigo,
        titulo: this.livros.get(codigo)?.titulo ?? codigo,
        vezes,
      }))
      .sort((a, b) => b.vezes - a.vezes);
    return {
      totalEmprestimos: this.emprestimos.length,
      totalDevolucoes,
      totalMultas: Math.round(totalMultas * 100) / 100,
      livrosMaisUtilizados,
    };
  }

  private exigirLivro(codigo: string): Livro {
    const l = this.livros.get(codigo);
    if (!l) throw new RegistroNaoEncontrado(`Livro ${codigo} não encontrado`);
    return l;
  }

  // RNF06 — Confiabilidade: serialização para persistência (sem perda de dados)
  toJSON(): string {
    return JSON.stringify({
      usuarios: [...this.usuarios.values()],
      livros: [...this.livros.values()],
      emprestimos: this.emprestimos,
      seq: this.seq,
    });
  }
  static fromJSON(json: string): Biblioteca {
    const dados = JSON.parse(json);
    const b = new Biblioteca();
    for (const u of dados.usuarios) b.usuarios.set(u.id, u);
    for (const l of dados.livros) b.livros.set(l.codigo, l);
    b.emprestimos = dados.emprestimos;
    b.seq = dados.seq;
    return b;
  }
}
