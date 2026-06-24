// =============================================================================
// Sistema de Biblioteca — Empréstimo e Devolução de Livros
// Implementa SOMENTE os requisitos especificados (RF01..RF10, RNF03/04/06).
// (Os demais RNF — desempenho, escalabilidade etc. — são exercitados pelos
//  testes de desempenho em perf/desempenho.ts.)
// =============================================================================
export const PRAZO_DIAS = 14;
export const MULTA_POR_DIA = 1.0; // R$ por dia de atraso (RF09)
// --- Erros de domínio --------------------------------------------------------
export class NaoAutenticado extends Error {
} // RNF03
export class LivroIndisponivel extends Error {
} // Cenário 2 / RF03
export class RegistroNaoEncontrado extends Error {
}
// --- Helpers de data ---------------------------------------------------------
function parse(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}
function format(date) {
    return date.toISOString().slice(0, 10);
}
export function addDays(iso, dias) {
    const d = parse(iso);
    d.setUTCDate(d.getUTCDate() + dias);
    return format(d);
}
function diffDays(isoA, isoB) {
    return Math.round((parse(isoA).getTime() - parse(isoB).getTime()) / 86400000);
}
// --- Sistema (fachada) -------------------------------------------------------
export class Biblioteca {
    constructor() {
        this.usuarios = new Map();
        this.livros = new Map();
        this.emprestimos = [];
        this.seq = 1;
        this.usuarioLogado = null;
    }
    // RF01 — Cadastro de Usuários
    cadastrarUsuario(id, nome) {
        const u = { id, nome };
        this.usuarios.set(id, u);
        return u;
    }
    // RF02 — Cadastro e atualização do acervo de livros
    cadastrarLivro(codigo, titulo, quantidade) {
        const l = { codigo, titulo, total: quantidade, disponivel: quantidade };
        this.livros.set(codigo, l);
        return l;
    }
    atualizarLivro(codigo, dados) {
        const l = this.exigirLivro(codigo);
        if (dados.titulo !== undefined)
            l.titulo = dados.titulo;
        if (dados.total !== undefined) {
            const emprestados = l.total - l.disponivel;
            l.total = dados.total;
            l.disponivel = Math.max(0, dados.total - emprestados);
        }
        return l;
    }
    // RNF03 — Segurança: somente usuários autenticados operam o sistema
    login(usuarioId) {
        const u = this.usuarios.get(usuarioId);
        if (!u)
            throw new RegistroNaoEncontrado("Usuário não cadastrado");
        this.usuarioLogado = u;
        return u;
    }
    logout() {
        this.usuarioLogado = null;
    }
    exigirLogin() {
        if (!this.usuarioLogado)
            throw new NaoAutenticado("É necessário estar autenticado (RNF03)");
        return this.usuarioLogado;
    }
    // RF03 — Consulta de disponibilidade
    consultarDisponibilidade(codigo) {
        return this.exigirLivro(codigo).disponivel;
    }
    pesquisar(termo) {
        const t = termo.trim().toLowerCase();
        return [...this.livros.values()].filter((l) => l.titulo.toLowerCase().includes(t) || l.codigo.toLowerCase() === t);
    }
    // RF04 — Realização de empréstimo
    realizarEmprestimo(livroCodigo, hoje) {
        const usuario = this.exigirLogin(); // RNF03
        const livro = this.exigirLivro(livroCodigo);
        // RNF04 — integridade: nunca emprestar exemplar inexistente (Cenário 2)
        if (livro.disponivel <= 0)
            throw new LivroIndisponivel(`Não há exemplares de "${livro.titulo}"`);
        livro.disponivel -= 1; // RF06 — controle de quantidade
        const emp = {
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
    registrarDevolucao(emprestimoId, dataDevolucao) {
        this.exigirLogin(); // RNF03
        const emp = this.emprestimos.find((e) => e.id === emprestimoId && !e.dataDevolucao);
        if (!emp)
            throw new RegistroNaoEncontrado("Empréstimo ativo não encontrado");
        emp.dataDevolucao = dataDevolucao;
        const atraso = diffDays(dataDevolucao, emp.dataPrevista); // RF08
        emp.diasAtraso = atraso > 0 ? atraso : 0;
        emp.multa = Math.round(emp.diasAtraso * MULTA_POR_DIA * 100) / 100; // RF09
        this.exigirLivro(emp.livroCodigo).disponivel += 1; // RF06
        return emp;
    }
    // RF07 — Consulta de empréstimos ativos de um usuário
    emprestimosAtivos(usuarioId) {
        return this.emprestimos.filter((e) => e.usuarioId === usuarioId && !e.dataDevolucao);
    }
    // RF10 — Emissão de relatórios
    relatorios() {
        const totalDevolucoes = this.emprestimos.filter((e) => e.dataDevolucao).length;
        const totalMultas = this.emprestimos.reduce((s, e) => s + e.multa, 0);
        const contagem = new Map();
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
    exigirLivro(codigo) {
        const l = this.livros.get(codigo);
        if (!l)
            throw new RegistroNaoEncontrado(`Livro ${codigo} não encontrado`);
        return l;
    }
    // RNF06 — Confiabilidade: serialização para persistência (sem perda de dados)
    toJSON() {
        return JSON.stringify({
            usuarios: [...this.usuarios.values()],
            livros: [...this.livros.values()],
            emprestimos: this.emprestimos,
            seq: this.seq,
        });
    }
    static fromJSON(json) {
        const dados = JSON.parse(json);
        const b = new Biblioteca();
        for (const u of dados.usuarios)
            b.usuarios.set(u.id, u);
        for (const l of dados.livros)
            b.livros.set(l.codigo, l);
        b.emprestimos = dados.emprestimos;
        b.seq = dados.seq;
        return b;
    }
}
