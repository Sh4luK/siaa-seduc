
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import logo from "../../../assets/logo.png";
import layoutStyles from "../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

const STATUS_LABEL = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
};

export default function SolicitacoesAlunoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [turma, setTurma] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nomeResp, setNomeResp] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senhaResp, setSenhaResp] = useState("");
  const [enviando, setEnviando] = useState(false);

  const router = useRouter();

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch(`${API_BASE}/api/students/solicitacoes`);
      if (!res.ok) throw new Error(`Falha ao buscar solicitações (status ${res.status})`);
      const data = await res.json();
      setSolicitacoes(data.solicitacoes || []);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/students/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/aluno/login");
          return;
        }
        setAuthenticated(true);
        setNomeCompleto(authData.student?.nome_completo || "");
        setTurma(authData.student?.turma || "");
        setLoading(false);
        await carregar();
      } catch (error) {
        setErro(`Erro ao carregar dados: ${error.message}`);
        setLoading(false);
      }
    }
    init();
  }, [router, carregar]);

  async function handleCriar(e) {
    e.preventDefault();
    setErro(null);

    if (!nomeResp.trim() || !parentesco.trim() || !senhaResp.trim()) {
      setErro("Preencha nome, parentesco e senha.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/students/solicitacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_completo: nomeResp.trim(),
          parentesco: parentesco.trim(),
          cpf: cpf.trim(),
          telefone: telefone.trim(),
          senha: senhaResp.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.detail || "Não foi possível criar a solicitação.");
      }
      setNomeResp("");
      setParentesco("");
      setCpf("");
      setTelefone("");
      setSenhaResp("");
      setMostrarForm(false);
      await carregar();
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setEnviando(false);
    }
  }

  async function responder(id, decisao) {
    setErro(null);
    try {
      const res = await fetch(`${API_BASE}/api/students/solicitacoes/${id}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisao }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.detail || "Não foi possível responder à solicitação.");
      }
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir(id) {
    setErro(null);
    try {
      const res = await fetch(`${API_BASE}/api/students/solicitacoes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Não foi possível remover.");
      setSolicitacoes((atual) => atual.filter((s) => s.id !== id));
    } catch (e) {
      setErro(e.message);
    } finally {
      setConfirmandoId(null);
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
          <p className={layoutStyles.loadingText}>Carregando…</p>
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
            <Link href="/aluno/atividades" className={layoutStyles.navLink}>
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
            <Link href="/aluno/solicitacoes" className={layoutStyles.navLinkActive}>
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
            <span className={layoutStyles.topbarTitle}>Responsáveis</span>
          </header>

          <main className={layoutStyles.main}>
            <div className={styles.headerRow}>
              <div>
                <h1 className={layoutStyles.greeting}>Responsáveis</h1>
                <p className={layoutStyles.subtitle}>Gerencie quem tem acesso ao seu acompanhamento.</p>
              </div>
              <button className={styles.novoBotao} onClick={() => setMostrarForm((v) => !v)}>
                {mostrarForm ? "Cancelar" : "+ Adicionar responsável"}
              </button>
            </div>

            {erro && <div className={styles.erro}>{erro}</div>}

            {mostrarForm && (
              <form onSubmit={handleCriar} className={styles.form}>
                <div className={styles.linhaDupla}>
                  <div className={styles.campo}>
                    <label className={styles.label}>Nome completo</label>
                    <input className={styles.input} value={nomeResp} onChange={(e) => setNomeResp(e.target.value)} />
                  </div>
                  <div className={styles.campo}>
                    <label className={styles.label}>Parentesco</label>
                    <input
                      className={styles.input}
                      placeholder="Ex: Mãe, Pai, Avó..."
                      value={parentesco}
                      onChange={(e) => setParentesco(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.linhaDupla}>
                  <div className={styles.campo}>
                    <label className={styles.label}>CPF (opcional)</label>
                    <input className={styles.input} value={cpf} onChange={(e) => setCpf(e.target.value)} />
                  </div>
                  <div className={styles.campo}>
                    <label className={styles.label}>Telefone (opcional)</label>
                    <input className={styles.input} value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                  </div>
                </div>

                <div className={styles.campo}>
                  <label className={styles.label}>Senha de acesso do responsável</label>
                  <input
                    type="password"
                    className={styles.input}
                    value={senhaResp}
                    onChange={(e) => setSenhaResp(e.target.value)}
                  />
                  <span className={styles.dica}>
                    Essa senha será usada pelo responsável para acompanhar suas notas quando o acesso for aprovado.
                  </span>
                </div>

                <button type="submit" disabled={enviando} className={styles.enviarBtn}>
                  {enviando ? "Enviando..." : "Enviar solicitação"}
                </button>
              </form>
            )}

            {carregando ? (
              <p className={styles.subtitle}>Carregando...</p>
            ) : solicitacoes.length === 0 ? (
              <p className={styles.vazio}>Nenhum responsável cadastrado ainda.</p>
            ) : (
              <ul className={styles.lista}>
                {/* {solicitacoes.map((s) => (
                  <li key={s.id} className={styles.card}>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardTopo}>
                        <p className={styles.cardNome}>{s.responsavel_nome}</p>
                        <span
                          className={
                            s.status === "APROVADO"
                              ? styles.badgeAprovado
                              : s.status === "RECUSADO"
                              ? styles.badgeRecusado
                              : styles.badgePendente
                          }
                        >
                          {STATUS_LABEL[s.status]}
                        </span>
                      </div>
                      <p className={styles.cardMeta}>
                        {s.parentesco}
                        {s.telefone ? ` · ${s.telefone}` : ""} · solicitado em {formatarData(s.data_solicitacao)}
                      </p>
                    </div>

                    {confirmandoId === s.id ? (
                      <div className={styles.confirmarExclusao}>
                        {s.status === "APROVADO" ? "Revogar acesso?" : "Cancelar?"}
                        <button onClick={() => excluir(s.id)}>Sim</button>
                        <button onClick={() => setConfirmandoId(null)}>Não</button>
                      </div>
                    ) : (
                      <button className={styles.excluirBotao} onClick={() => setConfirmandoId(s.id)}>
                        {s.status === "APROVADO" ? "Revogar" : "Cancelar"}
                      </button>
                    )}
                  </li>
                ))} */}
                {solicitacoes.map((s) => (
                  <li key={s.id} className={styles.card}>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardTopo}>
                        <p className={styles.cardNome}>{s.responsavel_nome}</p>
                        <span
                          className={
                            s.status === "APROVADO"
                              ? styles.badgeAprovado
                              : s.status === "RECUSADO"
                                ? styles.badgeRecusado
                                : styles.badgePendente
                          }
                        >
                          {STATUS_LABEL[s.status]}
                        </span>
                      </div>
                      <p className={styles.cardMeta}>
                        {s.parentesco}
                        {s.telefone ? ` · ${s.telefone}` : ""} · solicitado em {formatarData(s.data_solicitacao)}
                        {s.origem === "RESPONSAVEL" && s.status === "PENDENTE" && (
                          <span className={styles.origemTag}> · solicitado por ele(a)</span>
                        )}
                      </p>
                    </div>

                    {s.origem === "RESPONSAVEL" && s.status === "PENDENTE" ? (
                      <div className={styles.acoesResposta}>
                        <button className={styles.aprovarBotao} onClick={() => responder(s.id, "APROVADO")}>
                          Aprovar
                        </button>
                        <button className={styles.recusarBotao} onClick={() => responder(s.id, "RECUSADO")}>
                          Recusar
                        </button>
                      </div>
                    ) : confirmandoId === s.id ? (
                      <div className={styles.confirmarExclusao}>
                        {s.status === "APROVADO" ? "Revogar acesso?" : "Cancelar?"}
                        <button onClick={() => excluir(s.id)}>Sim</button>
                        <button onClick={() => setConfirmandoId(null)}>Não</button>
                      </div>
                    ) : (
                      <button className={styles.excluirBotao} onClick={() => setConfirmandoId(s.id)}>
                        {s.status === "APROVADO" ? "Revogar" : "Cancelar"}
                      </button>
                    )}
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