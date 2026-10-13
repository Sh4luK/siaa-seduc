"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";
import ImportarPlanilha from "../../coordenacao/ImportarPlanilha";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function GerenciarTurma({ nomeTurma, onErro, onSucesso, onMudou }) {
  const [membros, setMembros] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [busca, setBusca] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [professorId, setProfessorId] = useState("");
  const [disciplina, setDisciplina] = useState("");

  async function carregarMembros() {
    const res = await fetch(
      `${API_BASE}/api/corrigir/turmas/membros?turma=${encodeURIComponent(nomeTurma)}`,
      { credentials: "include" }
    );
    if (!res.ok) throw new Error(`Falha ao buscar a turma (status ${res.status})`);
    setMembros(await res.json());
  }

  useEffect(() => {
    async function init() {
      try {
        await carregarMembros();
      } catch (error) {
        onErro(error.message);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomeTurma]);

  useEffect(() => {
    const termo = busca.trim();
    if (termo.length < 2) return;

    let cancelado = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/corrigir/alunos?busca=${encodeURIComponent(termo)}`,
          { credentials: "include" }
        );
        const data = res.ok ? await res.json() : { alunos: [] };
        if (!cancelado) setResultadosBusca(data.alunos || []);
      } catch {
        if (!cancelado) setResultadosBusca([]);
      }
    }, 300);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [busca]);

  async function enviar(caminho, corpo) {
    setOcupado(true);
    onErro(null);
    try {
      const res = await fetch(`${API_BASE}/api/corrigir/turmas/${caminho}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const texto = await res.text();
      let data = {};
      try { data = JSON.parse(texto); } catch {}
      if (!res.ok) throw new Error(data.message || "Falha ao salvar.");
      onSucesso(data.message);
      await carregarMembros();
      await onMudou();
      return true;
    } catch (error) {
      onSucesso(null);
      onErro(error.message);
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function handleAdicionarAluno(alunoId) {
    const ok = await enviar("alunos/adicionar", { turma: nomeTurma, aluno_id: alunoId });
    if (ok) setBusca("");
  }

  async function handleAdicionarProfessor() {
    const ok = await enviar("professores/adicionar", {
      turma: nomeTurma,
      professor_id: Number(professorId),
      disciplina,
    });
    if (ok) {
      setProfessorId("");
      setDisciplina("");
    }
  }

  if (!membros) return <p className={styles.painelVazio}>Carregando…</p>;

  const buscando = busca.trim().length >= 2;
  const idsNaTurma = new Set(membros.alunos.map((a) => a.id));
  const candidatos = resultadosBusca.filter((a) => !idsNaTurma.has(a.id));

  return (
    <div className={styles.painel}>
      <section className={styles.painelSecao}>
        <h2 className={styles.painelTitulo}>Professores ({membros.professores.length})</h2>
        {membros.professores.length === 0 ? (
          <p className={styles.painelVazio}>Nenhum professor vinculado.</p>
        ) : (
          <ul className={styles.membros}>
            {membros.professores.map((p) => (
              <li key={p.vinculo_id} className={styles.membro}>
                <span className={styles.membroNome}>
                  {p.nome_completo}
                  <span className={styles.membroDetalhe}> · {p.disciplina || "sem disciplina"}</span>
                </span>
                <button
                  type="button"
                  className={styles.botaoRemover}
                  onClick={() => enviar("professores/remover", { vinculo_id: p.vinculo_id })}
                  disabled={ocupado}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.painelAdicionar}>
          <select
            className={styles.input}
            value={professorId}
            onChange={(e) => setProfessorId(e.target.value)}
            aria-label="Professor"
          >
            <option value="">Selecione o professor</option>
            {membros.opcoes_professores.map((p) => (
              <option key={p.id} value={p.id}>{p.nome_completo}</option>
            ))}
          </select>
          <select
            className={styles.input}
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value)}
            aria-label="Disciplina"
          >
            <option value="">Selecione a disciplina</option>
            {membros.opcoes_disciplinas.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button
            type="button"
            className={styles.botaoSalvar}
            onClick={handleAdicionarProfessor}
            disabled={ocupado || !professorId || !disciplina}
          >
            Adicionar professor
          </button>
        </div>
      </section>

      <section className={styles.painelSecao}>
        <h2 className={styles.painelTitulo}>Alunos ({membros.alunos.length})</h2>
        {membros.alunos.length === 0 ? (
          <p className={styles.painelVazio}>Nenhum aluno matriculado.</p>
        ) : (
          <ul className={styles.membros}>
            {membros.alunos.map((a) => (
              <li key={a.id} className={styles.membro}>
                <span className={styles.membroNome}>{a.nome_completo}</span>
                <button
                  type="button"
                  className={styles.botaoRemover}
                  onClick={() => enviar("alunos/remover", { aluno_id: a.id })}
                  disabled={ocupado}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.painelAdicionar}>
          <input
            type="text"
            className={styles.input}
            placeholder="Buscar aluno pelo nome para adicionar"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        {buscando && candidatos.length === 0 && (
          <p className={styles.painelVazio}>Nenhum aluno encontrado fora desta turma.</p>
        )}
        {buscando && candidatos.length > 0 && (
          <ul className={styles.membros}>
            {candidatos.map((a) => (
              <li key={a.id} className={styles.membro}>
                <span className={styles.membroNome}>
                  {a.nome_completo}
                  <span className={styles.membroDetalhe}> · {a.turma ? `hoje em ${a.turma}` : "sem turma"}</span>
                </span>
                <button
                  type="button"
                  className={styles.botaoSalvar}
                  onClick={() => handleAdicionarAluno(a.id)}
                  disabled={ocupado}
                >
                  Adicionar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function CorrigirTurmasPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [turmas, setTurmas] = useState([]);
  const [editandoTurma, setEditandoTurma] = useState(null);
  const [gerenciandoTurma, setGerenciandoTurma] = useState(null);
  const [novoNome, setNovoNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState([]);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const router = useRouter();

  async function carregar() {
    const res = await fetch(`${API_BASE}/api/corrigir/turmas`, { credentials: "include" });
    if (!res.ok) throw new Error(`Falha ao buscar turmas (status ${res.status})`);
    const data = await res.json();
    setTurmas(data.turmas || []);
  }

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`, { credentials: "include" });
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/coordenacao/login");
          return;
        }
        setAuthenticated(true);
        await carregar();
      } catch (error) {
        setErros([`Erro ao carregar: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  async function handleRenomear(turmaAntiga) {
    setSalvando(true);
    setErros([]);
    setMensagemSucesso(null);
    try {
      const res = await fetch(`${API_BASE}/api/corrigir/turmas/renomear`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turma_antiga: turmaAntiga, turma_nova: novoNome.trim() }),
      });
      const corpo = await res.text();
      if (!res.ok) {
        let msg = "Falha ao renomear.";
        try { msg = JSON.parse(corpo).message || msg; } catch {}
        throw new Error(msg);
      }
      const data = JSON.parse(corpo);
      setMensagemSucesso(data.message);
      setEditandoTurma(null);
      await carregar();
    } catch (error) {
      setErros([error.message]);
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <div className={styles.headerLoading}>
            <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
            <p className={styles.subtituloLoading}>Verificando credenciais…</p>
          </div>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <Link href="/corrigir" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Correção de dados
        </Link>

        <h1 className={styles.title}>Turmas</h1>
        <p className={styles.subtitle}>
          Adicione ou remova professores e alunos de cada turma. Turmas marcadas com{" "}
          <span className={styles.badgeAlerta}>divergente</span> existem só do lado de professores ou só do
          lado de alunos — provável erro de digitação no nome.
        </p>

        <ImportarPlanilha tipo="turmas" onImportado={carregar} />

        {erros.length > 0 && (
          <ul className={styles.listaErros}>{erros.map((e, i) => <li key={i}>{e}</li>)}</ul>
        )}
        {mensagemSucesso && <p className={styles.mensagemSucesso}>{mensagemSucesso}</p>}

        <ul className={styles.lista}>
          {turmas.map((t) => {
            const divergente = !(t.existe_em_atravessa_por && t.existe_em_estudante);
            const editando = editandoTurma === t.nome_turma;
            const gerenciando = gerenciandoTurma === t.nome_turma;

            return (
              <li
                key={t.nome_turma}
                className={`${styles.item} ${divergente ? styles.itemDivergente : ""}`}
              >
                <div className={styles.itemInfo}>
                  <div className={styles.itemTopo}>
                    <p className={styles.itemNome}>{t.nome_turma}</p>
                    {divergente && <span className={styles.badgeAlerta}>divergente</span>}
                  </div>
                  <p className={styles.itemMeta}>
                    {t.total_registros} vínculo(s) de professor · {t.total_alunos} aluno(s)
                    {!t.existe_em_atravessa_por && " · sem professores vinculados"}
                    {!t.existe_em_estudante && " · sem alunos matriculados"}
                  </p>
                </div>

                {editando ? (
                  <div className={styles.itemAcoes}>
                    <input
                      type="text"
                      className={styles.input}
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className={styles.botaoSalvar}
                      onClick={() => handleRenomear(t.nome_turma)}
                      disabled={salvando}
                    >
                      {salvando ? "..." : "Salvar"}
                    </button>
                    <button type="button" className={styles.botaoCancelar} onClick={() => setEditandoTurma(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className={styles.itemAcoes}>
                    <button
                      type="button"
                      className={styles.botaoCancelar}
                      onClick={() => setGerenciandoTurma(gerenciando ? null : t.nome_turma)}
                    >
                      {gerenciando ? "Fechar" : "Professores e alunos"}
                    </button>
                    <button
                      type="button"
                      className={styles.botaoEditar}
                      onClick={() => {
                        setEditandoTurma(t.nome_turma);
                        setNovoNome(t.nome_turma);
                      }}
                    >
                      Renomear
                    </button>
                  </div>
                )}

                {gerenciando && (
                  <GerenciarTurma
                    nomeTurma={t.nome_turma}
                    onErro={(msg) => setErros(msg ? [msg] : [])}
                    onSucesso={setMensagemSucesso}
                    onMudou={carregar}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}