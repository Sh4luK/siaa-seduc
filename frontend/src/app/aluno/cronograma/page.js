"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import logo from "../../../assets/logo.png";
import layoutStyles from "../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function formatarData(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function CronogramaAlunoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [turma, setTurma] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [estudos, setEstudos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [titulo, setTitulo] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [data, setData] = useState("");
  const [enviando, setEnviando] = useState(false);

  const router = useRouter();

  const carregar = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/students/cronograma`);
    if (res.ok) {
      const d = await res.json();
      setEstudos(d.estudos || []);
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
        await carregar();
      } catch (error) {
        setErro(`Erro ao carregar cronograma: ${error.message}`);
      } finally {
        setLoading(false);
        setCarregando(false);
      }
    }
    init();
  }, [router, carregar]);

  async function handleCriar(e) {
    e.preventDefault();
    setErro(null);

    if (!titulo.trim() || !data) {
      setErro("Preencha o título e a data.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/students/cronograma`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: titulo.trim(), disciplina: disciplina.trim(), data }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.detail || "Não foi possível criar o estudo.");
      }
      setTitulo("");
      setDisciplina("");
      setData("");
      await carregar();
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setEnviando(false);
    }
  }

  async function alternarConcluido(id) {
    setErro(null);
    try {
      const res = await fetch(`${API_BASE}/api/students/cronograma/${id}/concluir`, { method: "POST" });
      if (!res.ok) throw new Error("Não foi possível atualizar.");
      const d = await res.json();
      setEstudos((atual) => atual.map((e) => (e.id === id ? { ...e, concluido: d.concluido } : e)));
    } catch (e2) {
      setErro(e2.message);
    }
  }

  async function excluir(id) {
    setErro(null);
    try {
      const res = await fetch(`${API_BASE}/api/students/cronograma/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Não foi possível excluir.");
      setEstudos((atual) => atual.filter((e) => e.id !== id));
    } catch (e2) {
      setErro(e2.message);
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
          <p className={layoutStyles.loadingText}>Carregando cronograma…</p>
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
            <Link href="/aluno/cronograma" className={layoutStyles.navLinkActive}>
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
            <span className={layoutStyles.topbarTitle}>Cronograma</span>
          </header>

          <main className={layoutStyles.main}>
            <h1 className={layoutStyles.greeting}>Cronograma de estudos</h1>
            <p className={layoutStyles.subtitle}>Organize seus próprios estudos.</p>

            {erro && <div className={styles.erro}>{erro}</div>}

            <form onSubmit={handleCriar} className={styles.form}>
              <div className={styles.linhaForm}>
                <input
                  type="text"
                  placeholder="O que estudar?"
                  className={styles.input}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Disciplina (opcional)"
                  className={styles.input}
                  value={disciplina}
                  onChange={(e) => setDisciplina(e.target.value)}
                />
                <input
                  type="date"
                  className={styles.input}
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
                <button type="submit" disabled={enviando} className={styles.addBtn}>
                  {enviando ? "Adicionando..." : "+ Adicionar"}
                </button>
              </div>
            </form>

            {carregando ? (
              <p className={styles.subtitle}>Carregando...</p>
            ) : estudos.length === 0 ? (
              <p className={styles.vazio}>Nenhum estudo programado ainda.</p>
            ) : (
              <ul className={styles.lista}>
                {estudos.map((e) => (
                  <li key={e.id} className={`${styles.item} ${e.concluido ? styles.itemConcluido : ""}`}>
                    <button
                      className={styles.checkbox}
                      onClick={() => alternarConcluido(e.id)}
                      aria-label={e.concluido ? "Marcar como não concluído" : "Marcar como concluído"}
                    >
                      {e.concluido && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemTitulo}>{e.titulo}</p>
                      <p className={styles.itemMeta}>
                        {e.disciplina && `${e.disciplina} · `}{formatarData(e.data)}
                      </p>
                    </div>
                    <button className={styles.excluirBtn} onClick={() => excluir(e.id)} aria-label="Excluir">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
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