"use client";

import logo from "../../../assets/logo.png"
import Image from "next/image"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import layoutStyles from "../page.module.css"
import styles from "./page.module.css"

const API_BASE = "https://q0w7c17l-8000.brs.devtunnels.ms";

export default function MinhasTurmasPage() {
  const [authenticated, setAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [turmasAgrupadas, setTurmasAgrupadas] = useState([])
  const [busca, setBusca] = useState("")
  const [erros, setErros] = useState([])
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

        const nome = authData.teacher.nome_completo;
        setNomeCompleto(nome);

        const turmasRes = await fetch(
          `${API_BASE}/api/teacher/search/turmas?nome_completo=${encodeURIComponent(nome)}`
        );
        if (!turmasRes.ok) throw new Error(`Falha ao buscar turmas (status ${turmasRes.status})`);
        const turmasData = await turmasRes.json();
        const turmas = turmasData.turmas || [];

        const grupos = {};
        for (const turma of turmas) {
          const chave = turma.turma;
          if (!grupos[chave]) {
            grupos[chave] = { nomeTurma: chave, etapa: turma.etapa, opcoes: [] };
          }
          grupos[chave].opcoes.push(turma);
        }

        setTurmasAgrupadas(Object.values(grupos));
      } catch (error) {
        setErros([`Erro ao carregar turmas: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  const turmasFiltradas = useMemo(() => {
    if (!busca.trim()) return turmasAgrupadas;
    const termo = busca.trim().toUpperCase();
    return turmasAgrupadas.filter((grupo) =>
      grupo.nomeTurma.toUpperCase().includes(termo) ||
      grupo.opcoes.some((o) => o.disciplina_lecionada?.toUpperCase().includes(termo))
    );
  }, [turmasAgrupadas, busca]);

  const totalDisciplinas = turmasAgrupadas.reduce((soma, g) => soma + g.opcoes.length, 0);

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}>
            <span className={layoutStyles.loadingBarFill} />
          </div>
          <p className={layoutStyles.loadingText}>Carregando turmas…</p>
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
            <Link href="/professor/turmas" className={layoutStyles.navLinkActive}>
              <i className="ti ti-users" aria-hidden="true" />
              Minhas turmas
            </Link>
            <Link href="/professor/calendario" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Calendario Escolar
            </Link>
            <Link href="/professor/frequencia" className={layoutStyles.navLink}>
              <i className="ti ti-clipboard-check" aria-hidden="true" />
              Frequencia
            </Link>
            <Link href="/professor/conteudos" className={layoutStyles.navLink}>
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
            <Link href="/professor/horarios" className={layoutStyles.navLink}>
              <i className="ti ti-clock" aria-hidden="true" />
              Horários
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
            <span className={layoutStyles.topbarTitle}>Minhas turmas</span>
          </header>

          <main className={layoutStyles.main}>
            <div className={styles.heroHeader}>
              <div>
                <h1 className={layoutStyles.greeting}>Minhas turmas</h1>
                <p className={layoutStyles.subtitle}>
                  Olá, {firstName}. Aqui está o panorama de tudo que você leciona.
                </p>
              </div>

              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <span className={styles.statValor}>{turmasAgrupadas.length}</span>
                  <span className={styles.statLabel}>Turma(s)</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValor}>{totalDisciplinas}</span>
                  <span className={styles.statLabel}>Disciplina(s)</span>
                </div>
              </div>
            </div>

            <div className={styles.buscaWrapper}>
              <i className="ti ti-search" aria-hidden="true" />
              <input
                type="text"
                placeholder="Buscar por turma ou disciplina..."
                className={styles.buscaInput}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              {busca && (
                <button
                  className={styles.buscaLimpar}
                  onClick={() => setBusca("")}
                  aria-label="Limpar busca"
                >
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              )}
            </div>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}

            {turmasFiltradas.length === 0 ? (
              <div className={styles.vazioWrapper}>
                <i className="ti ti-users" aria-hidden="true" />
                <p>
                  {busca
                    ? "Nenhuma turma ou disciplina corresponde à sua busca."
                    : "Nenhuma turma encontrada para este professor."}
                </p>
              </div>
            ) : (
              <div className={styles.turmasGrid}>
                {turmasFiltradas.map((grupo) => {
                  const primeiroRegistro = grupo.opcoes[0];

                  return (
                    <div key={grupo.nomeTurma} className={styles.turmaCard}>
                      <div className={styles.turmaCardTopo}>
                        <span className={styles.turmaSelo}>
                          {grupo.etapa?.charAt(0) || "?"}ª
                        </span>
                        <div className={styles.turmaCardInfo}>
                          <p className={styles.turmaCardNome} title={grupo.nomeTurma}>
                            {grupo.nomeTurma}
                          </p>
                          <p className={styles.turmaCardEtapa}>{grupo.etapa}</p>
                        </div>
                      </div>

                      <div className={styles.turmaCardDisciplinas}>
                        {grupo.opcoes.map((opcao) => (
                          <span key={opcao.id} className={styles.miniChip}>
                            {opcao.disciplina_lecionada}
                          </span>
                        ))}
                      </div>

                      <div className={styles.turmaCardAcoes}>
                        <Link
                          href={`/professor/turmas/${primeiroRegistro.id}`}
                          className={styles.acaoPrimaria}
                        >
                          Ver turma
                        </Link>
                        <Link
                          href={`/professor/notas/${primeiroRegistro.id}`}
                          className={styles.acaoSecundaria}
                          title="Lançar notas"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
                            <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
                            <path d="M16 5l3 3" />
                          </svg>
                        </Link>
                        <Link
                          href={`/professor/frequencia/turma/${primeiroRegistro.id}`}
                          className={styles.acaoSecundaria}
                          title="Registrar frequência"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
                            <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
                            <path d="M9 14l2 2l4 -4" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}