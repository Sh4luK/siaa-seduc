"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

export default function ProfessoresCoordenacaoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [professores, setProfessores] = useState([]);
  const [busca, setBusca] = useState("");
  const [erros, setErros] = useState([]);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [deletandoId, setDeletandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          setAuthenticated(false);
          router.push("/coordenacao/login");
          return;
        }
        setAuthenticated(true);

        const res = await fetch(`${API_BASE}/api/coordenacao/professores`);
        if (!res.ok) throw new Error(`Falha ao buscar professores (status ${res.status})`);
        const data = await res.json();
        setProfessores(data.professores || []);
      } catch (error) {
        setErros([`Erro ao carregar professores: ${error.message}`]);
      } finally {
        setLoading(false);
        setCarregando(false);
      }
    }

    init();
  }, [router]);

  async function handleDeletar(professorId) {
    setDeletandoId(professorId);
    setErros([]);
    setMensagemSucesso(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/coordenacao/professores/${professorId}/deletar`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const corpoErro = await res.text();
        let msg = `Falha ao apagar (status ${res.status})`;
        try {
          const json = JSON.parse(corpoErro);
          if (json.message) msg = json.message;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json();
      setProfessores((prev) => prev.filter((p) => p.id !== professorId));
      setMensagemSucesso(data.message);
    } catch (error) {
      setErros([`Erro ao apagar professor: ${error.message}`]);
    } finally {
      setDeletandoId(null);
      setConfirmandoId(null);
    }
  }

  const professoresFiltrados = professores.filter((p) =>
    p.nome_completo.toUpperCase().includes(busca.trim().toUpperCase())
  );

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <p className={styles.subtituloLoading}>Verificando credenciais…</p>
      </div>
    );
  }

  if (authenticated !== true) return null;

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <Link href="/coordenacao" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Coordenação
        </Link>

        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Professores</h1>
            <p className={styles.subtitle}>
              {professores.length} professor(es) cadastrado(s).
            </p>
          </div>
          <Link href="/coordenacao/professores/novo" className={styles.novoBotao}>
            + Novo professor
          </Link>
        </div>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        {mensagemSucesso && <p className={styles.mensagemSucesso}>{mensagemSucesso}</p>}

        <div className={styles.buscaWrapper}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
            <path d="M21 21l-6 -6" />
          </svg>
          <input
            type="text"
            placeholder="Buscar professor pelo nome..."
            className={styles.buscaInput}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {carregando ? (
          <p className={styles.subtitle}>Carregando professores...</p>
        ) : professoresFiltrados.length === 0 ? (
          <p className={styles.vazio}>
            {busca ? "Nenhum professor encontrado para essa busca." : "Nenhum professor cadastrado ainda."}
          </p>
        ) : (
          <ul className={styles.professoresList}>
            {professoresFiltrados.map((professor) => {
              const iniciais = professor.nome_completo
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              const confirmando = confirmandoId === professor.id;

              return (
                <li key={professor.id} className={styles.professorCard}>
                  <div className={styles.professorHeader}>
                    <span className={styles.professorAvatar}>{iniciais}</span>
                    <div className={styles.professorInfo}>
                      <p className={styles.professorNome}>{professor.nome_completo}</p>
                      <p className={styles.professorMeta}>
                        {professor.total_turmas} turma(s) · {professor.total_disciplinas} disciplina(s)
                      </p>
                    </div>

                    <div className={styles.acoesHeader}>
                      <Link
                        href={`/coordenacao/professores/${professor.id}/editar`}
                        className={styles.editarBotao}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
                          <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
                        </svg>
                        Editar
                      </Link>

                      {!confirmando ? (
                        <button
                          type="button"
                          className={styles.apagarBotao}
                          onClick={() => setConfirmandoId(professor.id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 7l16 0" />
                            <path d="M10 11l0 6" />
                            <path d="M14 11l0 6" />
                            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                            <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                          </svg>
                          Apagar
                        </button>
                      ) : (
                        <div className={styles.confirmacaoWrapper}>
                          <span className={styles.confirmacaoTexto}>Confirmar?</span>
                          <button
                            type="button"
                            className={styles.confirmarBotao}
                            onClick={() => handleDeletar(professor.id)}
                            disabled={deletandoId === professor.id}
                          >
                            {deletandoId === professor.id ? "Apagando..." : "Sim"}
                          </button>
                          <button
                            type="button"
                            className={styles.cancelarBotao}
                            onClick={() => setConfirmandoId(null)}
                            disabled={deletandoId === professor.id}
                          >
                            Não
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {professor.turmas.length === 0 ? (
                    <p className={styles.semTurmas}>Nenhuma turma atribuída.</p>
                  ) : (
                    <div className={styles.turmasList}>
                      {professor.turmas.map((turma) => (
                        <div key={turma.nome_turma} className={styles.turmaBloco}>
                          <p className={styles.turmaNome}>
                            {turma.nome_turma}
                            {turma.etapa && <span className={styles.turmaEtapa}> · {turma.etapa}</span>}
                          </p>
                          <div className={styles.disciplinasChips}>
                            {turma.disciplinas.map((disc, i) => (
                              <span key={i} className={styles.chip}>{disc}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}