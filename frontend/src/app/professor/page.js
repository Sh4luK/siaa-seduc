"use client"

import logo from "../../assets/logo.png"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import layoutStyles from "./page.module.css"
import styles from "./home.module.css"

const API_BASE = "http://127.0.0.1:8000";

export default function Professor() {
  const [authenticated, setAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nomeCompleto, setNomeCompleto] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [turmasAgrupadas, setTurmasAgrupadas] = useState([])
  const [disciplinas, setDisciplinas] = useState([])
  const router = useRouter()

  useEffect(() => {
    async function verifyAuthentication() {
      try {
        const url = `${API_BASE}/api/teacher/auth`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.return === true) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          router.push("/professor/login");
        }
      } catch (error) {
        setAuthenticated(false);
        router.push("/professor/login");
      } finally {
        setLoading(false);
      }
    }

    async function getData() {
      try {
        const urlAuth = `${API_BASE}/api/teacher/auth`;
        const authResponse = await fetch(urlAuth);
        if (!authResponse.ok) {
          throw new Error();
        }
        const data = await authResponse.json();
        const nome = data["teacher"]["nome_completo"] || "Não encontrado.";
        setNomeCompleto(nome);
        return nome;
      } catch (error) {
        setNomeCompleto("Erro ao carregar.");
        return null;
      }
    }

    async function getTurmas(nomeCompleto) {
      if (!nomeCompleto || nomeCompleto === "Não encontrado.") {
        setTurmasAgrupadas([]);
        return;
      }

      try {
        const urlTurmas = `${API_BASE}/api/teacher/search/turmas?nome_completo=${encodeURIComponent(nomeCompleto)}`;
        const urlDisciplinas = `${API_BASE}/api/teacher/search/disciplinas?nome_completo=${encodeURIComponent(nomeCompleto)}`;
        const response1 = await fetch(urlTurmas);
        const response2 = await fetch(urlDisciplinas);

        if (!response1.ok && !response2.ok) {
          throw new Error();
        }
        const data1 = await response1.json();
        const data2 = await response2.json()
        setDisciplinas(data2["disciplinas"] || [])

        const turmasBrutas = data1["turmas"] || [];
        const grupos = {};

        for (const turma of turmasBrutas) {
          const chave = turma.turma;
          if (!grupos[chave]) {
            grupos[chave] = {
              nomeTurma: chave,
              etapa: turma.etapa,
              opcoes: [],
            };
          }
          grupos[chave].opcoes.push(turma);
        }

        setTurmasAgrupadas(Object.values(grupos));
      } catch (error) {
        setTurmasAgrupadas([]);
      }
    }

    async function init() {
      await verifyAuthentication();
      const nome = await getData();
      await getTurmas(nome);
    }

    init();
  }, []);

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}>
            <span className={layoutStyles.loadingBarFill} />
          </div>
          <p className={layoutStyles.loadingText}>Verificando credenciais…</p>
        </div>
      </div>
    );
  }

  if (authenticated === true) {
    const firstName = nomeCompleto.split(" ")[0];
    const iniciais = nomeCompleto
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    const totalDisciplinas = turmasAgrupadas.reduce((soma, g) => soma + g.opcoes.length, 0);

    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.topBarInstitucional}>
          <span>Governo do Estado do Piauí</span>
          <span className={layoutStyles.topBarDivider} aria-hidden="true" />
          <span>Secretaria de Estado da Educação</span>
        </div>
        <div className={layoutStyles.shell}>
          <aside className={`${layoutStyles.sidebar} ${menuOpen ? layoutStyles.sidebarOpen : ""}`}>
            <div className={layoutStyles.sidebarHeader}>
              <Image src={logo} alt="Logo do SIAA" className={layoutStyles.sidebarLogo} priority />
              <span className={layoutStyles.sidebarBrand}>SIAA</span>
            </div>

            <nav className={layoutStyles.nav}>
              <Link href="/professor" className={layoutStyles.navLinkActive}>
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
              <span className={layoutStyles.topbarTitle}>Painel do professor</span>
            </header>

            <main className={layoutStyles.main}>
              <h1 className={layoutStyles.greeting}>Olá, {firstName}</h1>
              <p className={layoutStyles.subtitle}>
                Bem-vindo ao Sistema Integrado de Acompanhamento Acadêmico.
              </p>

              {/* Card de perfil do professor */}
              <div className={styles.perfilCard}>
                <div className={styles.perfilAvatar}>{iniciais}</div>
                <div className={styles.perfilInfo}>
                  <p className={styles.perfilNome}>{nomeCompleto}</p>
                  <p className={styles.perfilSubinfo}>
                    {turmasAgrupadas.length} turma(s) · {totalDisciplinas} disciplina(s)
                  </p>
                </div>
              </div>

              {/* Disciplinas lecionadas, como chips */}
              {disciplinas.length > 0 && (
                <div className={styles.disciplinasSection}>
                  <h2 className={styles.sectionTitulo}>Disciplinas que você leciona</h2>
                  <div className={styles.disciplinasChips}>
                    {disciplinas.map((d) => (
                      <span key={d.id} className={styles.chip}>
                        {d.nome_disciplina}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid de turmas */}
              <div className={styles.turmasSection}>
                <div className={styles.turmasSectionHeader}>
                  <h2 className={styles.sectionTitulo}>Suas turmas</h2>
                  <Link href="/professor/turmas" className={styles.verTodasLink}>
                    Ver todas
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6l-6 6" />
                    </svg>
                  </Link>
                </div>

                {turmasAgrupadas.length === 0 ? (
                  <p className={styles.vazio}>Nenhuma turma encontrada.</p>
                ) : (
                  <div className={styles.turmasGrid}>
                    {turmasAgrupadas.map((grupo) => {
                      const primeiroRegistro = grupo.opcoes[0];
                      return (
                        <Link
                          key={grupo.nomeTurma}
                          href={`/professor/turmas/${primeiroRegistro.id}`}
                          className={styles.turmaCard}
                        >
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

                          <div className={styles.turmaCardRodape}>
                            <span className={styles.turmaCardDisciplinasQtd}>
                              {grupo.opcoes.length}{" "}
                              {grupo.opcoes.length === 1 ? "disciplina" : "disciplinas"}
                            </span>
                            <span className={styles.turmaCardArrow} aria-hidden="true">→</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
