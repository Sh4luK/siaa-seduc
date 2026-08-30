"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import logo from "../../../assets/logo.png";
import Image from "next/image";

const API_BASE = "https://humble-spoon-4j654556jr9vf5qp6-8000.app.github.dev";

export default function AlunosCoordenacaoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [alunos, setAlunos] = useState([]);
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

        const res = await fetch(`${API_BASE}/api/coordenacao/alunos`);
        if (!res.ok) throw new Error(`Falha ao buscar alunos (status ${res.status})`);
        const data = await res.json();
        setAlunos(data.alunos || []);
      } catch (error) {
        setErros([`Erro ao carregar alunos: ${error.message}`]);
      } finally {
        setLoading(false);
        setCarregando(false);
      }
    }

    init();
  }, [router]);

  async function handleDeletar(alunoId) {
    setDeletandoId(alunoId);
    setErros([]);
    setMensagemSucesso(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/coordenacao/alunos/${alunoId}/deletar`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const corpoErro = await res.text();
        let msg = `Falha ao apagar (status ${res.status})`;
        try {
          const json = JSON.parse(corpoErro);
          if (json.message) msg = json.message;
        } catch { }
        throw new Error(msg);
      }

      const data = await res.json();
      setAlunos((prev) => prev.filter((a) => a.id !== alunoId));
      setMensagemSucesso(data.message);
    } catch (error) {
      setErros([`Erro ao apagar aluno: ${error.message}`]);
    } finally {
      setDeletandoId(null);
      setConfirmandoId(null);
    }
  }

  const alunosFiltrados = alunos.filter((a) => {
    const termo = busca.trim().toUpperCase();
    if (!termo) return true;
    return (
      a.nome_completo?.toUpperCase().includes(termo) ||
      a.turma?.toUpperCase().includes(termo) ||
      a.escola?.toUpperCase().includes(termo)
    );
  });

  // if (loading) {
  //   return (
  //     <div className={styles.pageLoading}>
  //       <p className={styles.subtituloLoading}>Verificando credenciais…</p>
  //     </div>
  //   );
  // }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <div className={styles.headerLoading}>
            <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
            <p className={styles.subtituloLoading}>Verificando sessão…</p>
          </div>
        </div>
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
            <h1 className={styles.title}>Alunos</h1>
            <p className={styles.subtitle}>
              {alunos.length} aluno(s) cadastrado(s).
            </p>
          </div>
          <Link href="/coordenacao/alunos/novo" className={styles.novoBotao}>
            + Cadastrar aluno
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
            placeholder="Buscar por nome, turma ou escola..."
            className={styles.buscaInput}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {carregando ? (
          <p className={styles.subtitle}>Carregando alunos...</p>
        ) : alunosFiltrados.length === 0 ? (
          <p className={styles.vazio}>
            {busca ? "Nenhum aluno encontrado para essa busca." : "Nenhum aluno cadastrado ainda."}
          </p>
        ) : (
          <div className={styles.alunosGrid}>
            {/* {alunosFiltrados.map((aluno) => {
              const iniciais = aluno.nome_completo
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              const confirmando = confirmandoId === aluno.id;

              return (
                <Link href={`/coordenacao/alunos/${aluno.id}`} key={aluno.id} style={{ textDecoration: "none" }} className={styles.alunoCard}>
                  <div className={styles.alunoCardHeader}>
                    <span className={styles.alunoAvatar}>{iniciais}</span>
                    <p className={styles.alunoNome} title={aluno.nome_completo}>
                      {aluno.nome_completo}
                    </p>
                  </div>

                  <div className={styles.alunoInfoGrid}>
                    <div className={styles.alunoInfoItem}>
                      <span className={styles.alunoInfoLabel}>Turma</span>
                      <span className={styles.alunoInfoValor}>{aluno.turma || "—"}</span>
                    </div>
                    <div className={styles.alunoInfoItem}>
                      <span className={styles.alunoInfoLabel}>Série</span>
                      <span className={styles.alunoInfoValor}>{aluno.serie || "—"}</span>
                    </div>
                    <div className={styles.alunoInfoItem}>
                      <span className={styles.alunoInfoLabel}>Escola</span>
                      <span className={styles.alunoInfoValor}>{aluno.escola || "—"}</span>
                    </div>
                    <div className={styles.alunoInfoItem}>
                      <span className={styles.alunoInfoLabel}>Período</span>
                      <span className={styles.alunoInfoValor}>{aluno.periodo || "—"}</span>
                    </div>
                    <div className={styles.alunoInfoItemFull}>
                      <span className={styles.alunoInfoLabel}>Curso</span>
                      <span className={styles.alunoInfoValor}>{aluno.curso || "—"}</span>
                    </div>
                  </div>

                  <div className={styles.alunoCardRodape}>
                    {!confirmando ? (
                      <>
                        <Link
                          href={`/coordenacao/alunos/${aluno.id}/editar`}
                          className={styles.editarBotao}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
                            <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
                          </svg>
                          Editar
                        </Link>
                        <button
                          type="button"
                          className={styles.apagarBotao}
                          onClick={() => setConfirmandoId(aluno.id)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 7l16 0" />
                            <path d="M10 11l0 6" />
                            <path d="M14 11l0 6" />
                            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                            <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                          </svg>
                          Apagar
                        </button>
                      </>
                    ) : (
                      <div className={styles.confirmacaoWrapper}>
                        <span className={styles.confirmacaoTexto}>Apagar aluno?</span>
                        <button
                          type="button"
                          className={styles.confirmarBotao}
                          onClick={() => handleDeletar(aluno.id)}
                          disabled={deletandoId === aluno.id}
                        >
                          {deletandoId === aluno.id ? "..." : "Sim"}
                        </button>
                        <button
                          type="button"
                          className={styles.cancelarBotao}
                          onClick={() => setConfirmandoId(null)}
                          disabled={deletandoId === aluno.id}
                        >
                          Não
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })} */}
            {alunosFiltrados.map((aluno) => {
              const iniciais = aluno.nome_completo
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              const confirmando = confirmandoId === aluno.id;

              return (
                <div key={aluno.id} className={styles.alunoCard}>
                  <Link href={`/coordenacao/alunos/${aluno.id}`} className={styles.alunoCardHeader}>
                    <span className={styles.alunoAvatar}>{iniciais}</span>
                    <p className={styles.alunoNome} title={aluno.nome_completo}>
                      {aluno.nome_completo}
                    </p>
                  </Link>

                  <div className={styles.alunoInfoGrid}>
                    <div className={styles.alunoInfoItem}>
                      <span className={styles.alunoInfoLabel}>Turma</span>
                      <span className={styles.alunoInfoValor}>{aluno.turma || "—"}</span>
                    </div>
                    <div className={styles.alunoInfoItem}>
                      <span className={styles.alunoInfoLabel}>Série</span>
                      <span className={styles.alunoInfoValor}>{aluno.serie || "—"}</span>
                    </div>
                    <div className={styles.alunoInfoItem}>
                      <span className={styles.alunoInfoLabel}>Escola</span>
                      <span className={styles.alunoInfoValor}>{aluno.escola || "—"}</span>
                    </div>
                    <div className={styles.alunoInfoItem}>
                      <span className={styles.alunoInfoLabel}>Período</span>
                      <span className={styles.alunoInfoValor}>{aluno.periodo || "—"}</span>
                    </div>
                    <div className={styles.alunoInfoItemFull}>
                      <span className={styles.alunoInfoLabel}>Curso</span>
                      <span className={styles.alunoInfoValor}>{aluno.curso || "—"}</span>
                    </div>
                  </div>

                  <div className={styles.alunoCardRodape}>
                    {!confirmando ? (
                      <>
                        <Link
                          href={`/coordenacao/alunos/${aluno.id}/editar`}
                          className={styles.editarBotao}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
                            <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
                          </svg>
                          Editar
                        </Link>
                        <button
                          type="button"
                          className={styles.apagarBotao}
                          onClick={() => setConfirmandoId(aluno.id)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 7l16 0" />
                            <path d="M10 11l0 6" />
                            <path d="M14 11l0 6" />
                            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                            <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                          </svg>
                          Apagar
                        </button>
                      </>
                    ) : (
                      <div className={styles.confirmacaoWrapper}>
                        <span className={styles.confirmacaoTexto}>Apagar aluno?</span>
                        <button
                          type="button"
                          className={styles.confirmarBotao}
                          onClick={() => handleDeletar(aluno.id)}
                          disabled={deletandoId === aluno.id}
                        >
                          {deletandoId === aluno.id ? "..." : "Sim"}
                        </button>
                        <button
                          type="button"
                          className={styles.cancelarBotao}
                          onClick={() => setConfirmandoId(null)}
                          disabled={deletandoId === aluno.id}
                        >
                          Não
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}