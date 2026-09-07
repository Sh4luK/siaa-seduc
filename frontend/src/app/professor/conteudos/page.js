"use client";

import logo from "../../../assets/logo.png"
import Image from "next/image"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import layoutStyles from "../page.module.css"
import styles from "./page.module.css"

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function hoje() {
  return new Date();
}

function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function ConteudosPage() {
  const [authenticated, setAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("")
  const [professorId, setProfessorId] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mesAtual, setMesAtual] = useState(hoje().getMonth() + 1)
  const [anoAtual, setAnoAtual] = useState(hoje().getFullYear())
  const [conteudos, setConteudos] = useState([])
  const [busca, setBusca] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [erros, setErros] = useState([])
  const [deletandoId, setDeletandoId] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          setAuthenticated(false);
          router.push("/professor/login");
          return;
        }
        setAuthenticated(true);
        setNomeCompleto(authData.teacher.nome_completo);
        setProfessorId(authData.teacher.id);
      } catch (error) {
        setErros([`Erro ao autenticar: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  useEffect(() => {
    if (!professorId) return;

    async function carregarConteudos() {
      setCarregando(true);
      setErros([]);

      try {
        const mesFormatado = String(mesAtual).padStart(2, "0");
        const url = `${API_BASE}/api/teacher/conteudos?professor=${professorId}&mes=${mesFormatado}&ano=${anoAtual}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Falha ao buscar conteúdos (status ${res.status})`);
        const data = await res.json();

        setConteudos(data.conteudos || []);
      } catch (error) {
        setErros([`Erro ao carregar conteúdos: ${error.message}`]);
      } finally {
        setCarregando(false);
      }
    }

    carregarConteudos();
  }, [professorId, mesAtual, anoAtual]);

  async function handleDeletar(conteudoId) {
    setDeletandoId(conteudoId);
    try {
      const res = await fetch(
        `${API_BASE}/api/teacher/conteudos/${conteudoId}/deletar`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`Falha ao remover (status ${res.status})`);

      setConteudos((prev) => prev.filter((c) => c.id !== conteudoId));
    } catch (error) {
      setErros([`Erro ao remover conteúdo: ${error.message}`]);
    } finally {
      setDeletandoId(null);
    }
  }

  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => hoje().getFullYear() - 2 + i);

  const conteudosFiltrados = conteudos
    .filter((c) => c.titulo.toUpperCase().includes(busca.trim().toUpperCase()))
    .slice()
    .sort((a, b) => b.data.localeCompare(a.data));

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}>
            <span className={layoutStyles.loadingBarFill} />
          </div>
          <p className={layoutStyles.loadingText}>Carregando conteúdos…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  const firstName = nomeCompleto.split(" ")[0];

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.shell}>
        <aside className={`${layoutStyles.sidebar} ${menuOpen ? layoutStyles.sidebarOpen : ""}`}>
          <div className={layoutStyles.sidebarHeader}>
            <Image src={logo} alt="Logo do SIAA" className={layoutStyles.sidebarLogo} priority />
            <span className={layoutStyles.sidebarBrand}>SIAA</span>
          </div>

          <nav className={layoutStyles.nav}>
            <Link href="/professor" className={layoutStyles.navLink}>
              <i className="ti ti-home" aria-hidden="true" />
              Início
            </Link>
            <Link href="/professor/turmas" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Minhas turmas
            </Link>
            <Link href="/professor/calendario" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Calendario Escolar
            </Link>
            <Link href="/professor/frequencia" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Frequencia
            </Link>
            <Link href="/professor/conteudos" className={layoutStyles.navLinkActive}>
              <i className="ti ti-users" aria-hidden="true" />
              Conteudos
            </Link>
            <Link href="/professor/comunicados" className={layoutStyles.navLink}>
              <i className="ti ti-message" aria-hidden="true" />
              Comunicados
            </Link>
            <Link href="/professor/atividades" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Atividades
            </Link>
            <Link href="/professor/avaliacoes" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Avaliações
            </Link>
            <Link href="/professor/notas" className={layoutStyles.navLink}>
              <i className="ti ti-edit" aria-hidden="true" />
              Lançar notas
            </Link>
            <Link href="/professor/mensagem" className={layoutStyles.navLink}>
              <i className="ti ti-clock" aria-hidden="true" />
              Mensagens
            </Link>
          </nav>

          <div className={layoutStyles.sidebarFooter}>
            <div>
              <span className={layoutStyles.infoCardHeader}>
                <span className={layoutStyles.infoCardSeal}>{firstName.charAt(0)}</span>
                <span className={layoutStyles.studentName}>{nomeCompleto}</span>
              </span>
            </div>
          </div>
        </aside>

        {menuOpen && (
          <button
            className={layoutStyles.overlay}
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <div className={layoutStyles.content}>
          <header className={layoutStyles.topbar}>
            <button
              className={layoutStyles.menuButton}
              aria-label="Abrir menu"
              onClick={() => setMenuOpen(true)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            <span className={layoutStyles.topbarTitle}>Conteúdos</span>
          </header>

          <main className={layoutStyles.main}>
            <div className={styles.headerRow}>
              <div>
                <h1 className={layoutStyles.greeting}>Conteúdos</h1>
                <p className={layoutStyles.subtitle}>
                  Conteúdos ministrados por turma e disciplina, {firstName}.
                </p>
              </div>
              <Link href="/professor/conteudos/novo" className={styles.novoBotao}>
                + Novo conteúdo
              </Link>
            </div>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}

            <div className={styles.filtrosRow}>
              <div className={styles.buscaWrapper}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                  <path d="M21 21l-6 -6" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por título..."
                  className={styles.buscaInput}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>

              <select
                className={styles.filtroSelect}
                value={mesAtual}
                onChange={(e) => setMesAtual(Number(e.target.value))}
              >
                {MESES.map((mes, i) => (
                  <option key={mes} value={i + 1}>{mes}</option>
                ))}
              </select>

              <select
                className={styles.filtroSelect}
                value={anoAtual}
                onChange={(e) => setAnoAtual(Number(e.target.value))}
              >
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>

            {carregando ? (
              <p className={styles.subtitle}>Carregando conteúdos...</p>
            ) : conteudosFiltrados.length === 0 ? (
              <p className={styles.vazio}>
                {busca
                  ? "Nenhum conteúdo corresponde à sua busca."
                  : "Nenhum conteúdo cadastrado para este período."}
              </p>
            ) : (
              <ul className={styles.conteudosList}>
                {conteudosFiltrados.map((c) => (
                  <li key={c.id} className={styles.conteudoCard}>
                    <div className={styles.conteudoCardData}>
                      {c.data.split("-")[2]}
                      <span>{MESES[Number(c.data.split("-")[1]) - 1].slice(0, 3)}</span>
                    </div>
                    <div className={styles.conteudoCardInfo}>
                      <p className={styles.conteudoCardTitulo}>{c.titulo}</p>
                      <p className={styles.conteudoCardMeta}>
                        {c.nome_turma} · {c.disciplina} · {formatarData(c.data)}
                      </p>
                      {c.descricao && (
                        <p className={styles.conteudoCardDescricao}>{c.descricao}</p>
                      )}
                      {/* {c.arquivo_url && (
                        <a
                          href={c.arquivo_url}
                          download
                          className={styles.arquivoLink}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                            <path d="M7 11l5 5l5 -5" />
                            <path d="M12 4l0 12" />
                          </svg>
                          Baixar {c.arquivo_nome}
                        </a>
                      )} */}
                      {c.arquivo_url && (
                        <a
                          href={`${API_BASE}${c.arquivo_url}`}
                          download
                          className={styles.arquivoLink}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                            <path d="M7 11l5 5l5 -5" />
                            <path d="M12 4l0 12" />
                          </svg>
                          Baixar {c.arquivo_nome}
                        </a>
                      )}
                    </div>
                    <button
                      className={styles.conteudoDeletar}
                      onClick={() => handleDeletar(c.id)}
                      disabled={deletandoId === c.id}
                      aria-label="Remover conteúdo"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6l-12 12" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </main>
        </div>
      </div>
    </div >
  );
}