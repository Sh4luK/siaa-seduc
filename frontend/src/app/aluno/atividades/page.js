"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import logo from "../../../assets/logo.png";
import layoutStyles from "../page.module.css";
import styles from "./page.module.css";

const API_BASE = "/backend-api";

function formatarData(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function AtividadesAlunoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [turma, setTurma] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [atividades, setAtividades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erros, setErros] = useState([]);
  const [solicitandoAlteracaoId, setSolicitandoAlteracaoId] = useState(null);
  const [mensagensEnvio, setMensagensEnvio] = useState({});
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/students/auth`, { credentials: "include" });
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/aluno/login");
          return;
        }
        setAuthenticated(true);
        setNomeCompleto(authData.student?.nome_completo || "");
        setTurma(authData.student?.turma || "");

        const res = await fetch(`${API_BASE}/api/students/atividades`, { credentials: "include" });
        if (!res.ok) throw new Error(`Falha ao buscar atividades (status ${res.status})`);
        const data = await res.json();
        const lista = data.atividades || [];
        setAtividades(lista);
      } catch (error) {
        setErros([`Erro ao carregar atividades: ${error.message}`]);
      } finally {
        setLoading(false);
        setCarregando(false);
      }
    }
    init();
  }, [router]);

  async function solicitarAlteracao(atividadeId) {
    setSolicitandoAlteracaoId(atividadeId);
    setMensagensEnvio((prev) => ({ ...prev, [atividadeId]: "" }));

    try {
      const res = await fetch(
        `${API_BASE}/api/students/atividades/${atividadeId}/solicitar-alteracao`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.detail || `Falha ao solicitar (status ${res.status})`);

      setAtividades((prev) => prev.map((atividade) => (
        atividade.id === atividadeId
          ? {
              ...atividade,
              envio: {
                ...atividade.envio,
                alteracao_status: "SOLICITADA",
                alteracao_solicitada_em: new Date().toISOString(),
              },
            }
          : atividade
      )));
      setMensagensEnvio((prev) => ({ ...prev, [atividadeId]: data.message }));
    } catch (error) {
      setMensagensEnvio((prev) => ({ ...prev, [atividadeId]: `Erro ao solicitar alteração: ${error.message}` }));
    } finally {
      setSolicitandoAlteracaoId(null);
    }
  }

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}>
            <span className={layoutStyles.loadingBarFill} />
          </div>
          <p className={layoutStyles.loadingText}>Carregando atividades…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.shell}>
        <aside className={`${layoutStyles.sidebar} ${menuOpen ? layoutStyles.sidebarOpen : ""}`}>
          <div className={layoutStyles.sidebarHeader}>
            <Image src={logo} alt="Logo do SIAA" className={layoutStyles.sidebarLogo} priority />
            <span className={layoutStyles.sidebarBrand}>SIAA</span>
          </div>

          <nav className={layoutStyles.nav}>
            <Link href="/aluno" className={layoutStyles.navLink}>
              <i className="ti ti-home" aria-hidden="true" />
              Início
            </Link>
            <Link href="/aluno/conteudos" className={layoutStyles.navLink}>
              <i className="ti ti-book" aria-hidden="true" />
              Conteúdos
            </Link>
            <Link href="/aluno/atividades" className={layoutStyles.navLinkActive}>
              <i className="ti ti-clipboard-list" aria-hidden="true" />
              Atividades
            </Link>
            <Link href="/aluno/frequencia" className={layoutStyles.navLink}>
              <i className="ti ti-calendar-stats" aria-hidden="true" />
              Frequência
            </Link>
            <Link href="/aluno/boletim" className={layoutStyles.navLink}>
              <i className="ti ti-report" aria-hidden="true" />
              Boletim
            </Link>
            <Link href="/aluno/cronograma" className={layoutStyles.navLink}>
              <i className="ti ti-calendar" aria-hidden="true" />
              Cronograma
            </Link>
            <Link href="/aluno/horarios" className={layoutStyles.navLink}>
              <i className="ti ti-clock" aria-hidden="true" />
              Horários
            </Link>
            <Link href="/aluno/solicitacoes" className={layoutStyles.navLink}>
              <i className="ti ti-users-group" aria-hidden="true" />
              Responsáveis
            </Link>
          </nav>

          <div className={layoutStyles.sidebarFooter}>
            <span className={layoutStyles.studentName}>{nomeCompleto}</span>
            <span className={layoutStyles.studentClass}>{turma}</span>
          </div>
        </aside>

        {menuOpen && (
          <button className={layoutStyles.overlay} aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />
        )}

        <div className={layoutStyles.content}>
          <header className={layoutStyles.topbar}>
            <button className={layoutStyles.menuButton} aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            <span className={layoutStyles.topbarTitle}>Atividades</span>
          </header>

          <main className={layoutStyles.main}>
            <h1 className={layoutStyles.greeting}>Atividades</h1>
            <p className={layoutStyles.subtitle}>Trabalhos e tarefas dos seus professores.</p>
            <Link href="/aluno/atividades/envios" className={styles.meusEnvios}>
              <i className="ti ti-folder-check" aria-hidden="true" />
              Meus envios
            </Link>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}

            {carregando ? (
              <p className={styles.subtitle}>Carregando...</p>
            ) : atividades.length === 0 ? (
              <p className={styles.vazio}>Nenhuma atividade publicada ainda.</p>
            ) : (
              <ul className={styles.lista}>
                {atividades.map((a) => (
                  <li key={a.id} className={styles.card}>
                    <div className={styles.cardIcone}>
                      <i className="ti ti-clipboard-list" aria-hidden="true" />
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardTopo}>
                        <p className={styles.cardTitulo}>{a.titulo}</p>
                        {a.envio?.corrigido_em ? (
                          <span className={styles.badgeCorrigida}>Corrigida</span>
                        ) : a.envio ? (
                          <span className={styles.badgeEnviada}>
                            {a.envio.atrasado ? "Enviada com atraso" : "Enviada"}
                          </span>
                        ) : a.status && (
                          <span className={a.status === "atrasado" ? styles.badgeAtrasado : styles.badgePendente}>
                            {a.status === "atrasado" ? "Em atraso" : "Pendente"}
                          </span>
                        )}
                      </div>
                      {a.disciplina && <span className={styles.disciplinaBadge}>{a.disciplina}</span>}
                      {a.descricao && <p className={styles.cardDescricao}>{a.descricao}</p>}
                      {a.data_entrega && (
                        <p className={styles.cardMeta}>Entrega: {formatarData(a.data_entrega)}</p>
                      )}
                      {a.arquivo && (
                        <p className={styles.cardMeta}>
                          <i className="ti ti-paperclip" aria-hidden="true" /> Material anexado pelo professor
                        </p>
                      )}
                      {!a.envio ? (
                        <Link href={`/aluno/atividades/${a.id}`} className={styles.abrirAtividade}>
                          <i className="ti ti-pencil" aria-hidden="true" />
                          Abrir e responder atividade
                        </Link>
                      ) : a.envio.alteracao_status === "APROVADA" ? (
                        <div className={`${styles.solicitacaoBox} ${styles.solicitacaoAprovada}`}>
                          <p className={styles.statusSolicitacao} role="status">
                            <i className="ti ti-circle-check" aria-hidden="true" />
                            O professor autorizou um novo envio.
                          </p>
                          <Link
                            href={`/aluno/atividades/${a.id}`}
                            className={`${styles.solicitarBotao} ${styles.editarBotao}`}
                          >
                            Enviar nova versão
                          </Link>
                        </div>
                      ) : (
                        <div className={styles.solicitacaoBox}>
                          <p className={styles.statusSolicitacao} role="status">
                            <i className="ti ti-alert-triangle" aria-hidden="true" />
                            {a.envio.alteracao_status === "SOLICITADA"
                              ? "Solicitação de novo envio aguardando resposta do professor."
                              : a.envio.alteracao_status === "NEGADA"
                                ? "O professor não autorizou o novo envio."
                                : "Já existe um envio para esta atividade."}
                          </p>
                          <Link href={`/aluno/atividades/${a.id}`} className={styles.abrirAtividade}>
                            Ver atividade e envio
                          </Link>
                          {a.envio.alteracao_status !== "SOLICITADA" && (
                            <button
                              type="button"
                              className={styles.solicitarBotao}
                              onClick={() => solicitarAlteracao(a.id)}
                              disabled={solicitandoAlteracaoId === a.id}
                            >
                              {solicitandoAlteracaoId === a.id ? "Solicitando..." : "Solicitar Novo Envio"}
                            </button>
                          )}
                        </div>
                      )}
                      {mensagensEnvio[a.id] && <p role="status">{mensagensEnvio[a.id]}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}