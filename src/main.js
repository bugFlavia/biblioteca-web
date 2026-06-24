// Liga o domínio à interface HTML.
// A cada operação, registra no painel "Registro de operações" QUAL requisito
// (RF/RNF) está sendo executado — isso é o "identificar o que está sendo feito
// durante a execução". Persiste o estado em localStorage (RNF06).
import { Biblioteca, NaoAutenticado, LivroIndisponivel } from "./biblioteca";
const CHAVE = "biblioteca-estado";
function carregar() {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo)
        return Biblioteca.fromJSON(salvo); // RNF06: recupera sem perda
    const b = new Biblioteca();
    b.cadastrarUsuario("u1", "Ana Souza");
    b.cadastrarUsuario("u2", "Bruno Lima");
    b.cadastrarLivro("L1", "Engenharia de Software - Sommerville", 2);
    b.cadastrarLivro("L2", "Clean Code - Robert Martin", 1);
    b.cadastrarLivro("L3", "O Programador Pragmático", 3);
    return b;
}
let bib = carregar();
const salvar = () => localStorage.setItem(CHAVE, bib.toJSON()); // RNF06
const $ = (s) => document.querySelector(s);
const hoje = () => $("[data-cy=hoje]").value;
// Painel que mostra QUAL requisito está sendo executado agora.
function registrar(rf, descricao) {
    const div = document.createElement("div");
    div.innerHTML = `<span class="tag">${rf}</span> ${descricao}`;
    $("[data-cy=registro]").appendChild(div);
    $("[data-cy=registro]").scrollTop = $("[data-cy=registro]").scrollHeight;
}
function mensagem(texto, tipo) {
    const el = $("[data-cy=mensagem]");
    el.textContent = texto;
    el.dataset.tipo = tipo;
}
function renderUsuarios() {
    $("[data-cy=select-usuario]").innerHTML =
        `<option value="u1">Ana Souza</option><option value="u2">Bruno Lima</option>`;
}
function renderResultados(livros) {
    $("[data-cy=resultados]").innerHTML = livros
        .map((l) => `<li data-cy="resultado" data-codigo="${l.codigo}">
        <strong>${l.titulo}</strong> —
        disponíveis: <span data-cy="disp" class="${l.disponivel === 0 ? "indisp" : ""}">${l.disponivel}</span>/${l.total}
        <button data-cy="btn-emprestar" data-codigo="${l.codigo}">Realizar Empréstimo</button>
      </li>`)
        .join("");
}
function renderMeusEmprestimos() {
    if (!bib.usuarioLogado) {
        $("[data-cy=meus-emprestimos]").innerHTML = "<li>Faça login.</li>";
        return;
    }
    const ativos = bib.emprestimosAtivos(bib.usuarioLogado.id);
    $("[data-cy=meus-emprestimos]").innerHTML =
        ativos
            .map((e) => `<li data-cy="meu-emprestimo" data-id="${e.id}">
          ${e.livroCodigo} — devolver até <span data-cy="prazo">${e.dataPrevista}</span>
          <button data-cy="btn-devolver" data-id="${e.id}">Devolver (em ${hoje()})</button>
        </li>`)
            .join("") || "<li>Nenhum empréstimo ativo.</li>";
}
function wire() {
    // RNF03 — login
    $("[data-cy=btn-login]").addEventListener("click", () => {
        const id = $("[data-cy=select-usuario]").value;
        const u = bib.login(id);
        $("[data-cy=usuario-logado]").textContent = u.nome;
        registrar("RNF03", `Login efetuado: ${u.nome}`);
        salvar();
        renderMeusEmprestimos();
    });
    // RF03 — pesquisa / consulta de disponibilidade
    $("[data-cy=btn-buscar]").addEventListener("click", () => {
        const termo = $("[data-cy=busca]").value;
        const livros = bib.pesquisar(termo);
        renderResultados(livros);
        registrar("RF03", `Consulta de disponibilidade para "${termo}" (${livros.length} resultado(s))`);
    });
    // RF04 — realizar empréstimo
    $("[data-cy=resultados]").addEventListener("click", (ev) => {
        const t = ev.target;
        if (t.dataset.cy !== "btn-emprestar")
            return;
        try {
            const e = bib.realizarEmprestimo(t.dataset.codigo, hoje());
            registrar("RF04", `Empréstimo #${e.id} de ${e.livroCodigo} para ${bib.usuarioLogado.nome}`);
            registrar("RF06", `Quantidade de ${e.livroCodigo} reduzida em 1 exemplar`);
            mensagem(`Empréstimo realizado. Devolver até ${e.dataPrevista}.`, "ok");
        }
        catch (err) {
            if (err instanceof NaoAutenticado) {
                registrar("RNF03", "Operação bloqueada: usuário não autenticado");
                mensagem(err.message, "erro");
            }
            else if (err instanceof LivroIndisponivel) {
                registrar("RF03", "Empréstimo bloqueado: livro indisponível");
                mensagem(err.message, "erro");
            }
            else {
                mensagem(err.message, "erro");
            }
        }
        salvar();
        renderResultados(bib.pesquisar($("[data-cy=busca]").value));
        renderMeusEmprestimos();
    });
    // RF05 — registrar devolução
    $("[data-cy=meus-emprestimos]").addEventListener("click", (ev) => {
        const t = ev.target;
        if (t.dataset.cy !== "btn-devolver")
            return;
        const e = bib.registrarDevolucao(Number(t.dataset.id), hoje());
        registrar("RF05", `Devolução do empréstimo #${e.id} registrada`);
        registrar("RF06", `Quantidade de ${e.livroCodigo} aumentada em 1 exemplar`);
        if (e.diasAtraso > 0) {
            registrar("RF08", `Atraso identificado: ${e.diasAtraso} dia(s)`);
            registrar("RF09", `Multa aplicada: R$ ${e.multa.toFixed(2)}`);
            mensagem(`Devolução com ${e.diasAtraso} dia(s) de atraso. Multa: R$ ${e.multa.toFixed(2)}.`, "ok");
        }
        else {
            mensagem("Devolução dentro do prazo. Sem multa.", "ok");
        }
        salvar();
        renderMeusEmprestimos();
    });
    // RF07 — consulta de empréstimos ativos
    $("[data-cy=btn-meus-emprestimos]").addEventListener("click", () => {
        registrar("RF07", "Consulta de empréstimos ativos do usuário");
        renderMeusEmprestimos();
    });
    // RF10 — relatórios
    $("[data-cy=btn-relatorio]").addEventListener("click", () => {
        const r = bib.relatorios();
        $("[data-cy=relatorio]").textContent = JSON.stringify(r, null, 2);
        registrar("RF10", "Relatório de empréstimos/devoluções/livros mais utilizados gerado");
    });
}
renderUsuarios();
wire();
renderMeusEmprestimos();
registrar("RF02", "Acervo carregado (livros cadastrados)");
