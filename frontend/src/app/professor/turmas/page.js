"use client";

import logo from "../../../assets/logo.png"
import Image from "next/image"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../page.module.css"

const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

export default function MinhasTurmasPage() {
  const [authenticated, setAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [turmas, setTurmas] = useState([])
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

        setTurmas(turmasData.turmas || []);
      } catch (error) {
        setErros([`Erro ao carregar turmas: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
          <div className={styles.loadingBar}>
            <span className={styles.loadingBarFill} />
          </div>
          <p className={styles.loadingText}>Carregando turmas…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  const firstName = nomeCompleto.split(" ")[0];

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.sidebarHeader}>
            <Image src={logo} alt="Logo do SIAA" className={styles.sidebarLogo} priority />
            <span className={styles.sidebarBrand}>SIAA</span>
          </div>

          <nav className={styles.nav}>
            <Link href="/professor" className={styles.navLink}>
              <i className="ti ti-home" aria-hidden="true" />
              Início
            </Link>
            <Link href="/professor/turmas" className={styles.navLinkActive}>
              <i className="ti ti-users" aria-hidden="true" />
              Minhas turmas
            </Link>
            <Link href="/professor/calendario" className={styles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Calendario Escolar
            </Link>
            <Link href="/professor/frequencia" className={styles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Frequencia
            </Link>
            <Link href="/professor/conteudos" className={styles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Conteudos
            </Link>
            <Link href="/professor/atividades" className={styles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Atividades
            </Link>
            <Link href="/professor/avaliacoes" className={styles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Avaliações
            </Link>
            <Link href="/professor/notas" className={styles.navLink}>
              <i className="ti ti-edit" aria-hidden="true" />
              Lançar notas
            </Link>
            <Link href="/professor/frequencia" className={styles.navLink}>
              <i className="ti ti-clipboard-check" aria-hidden="true" />
              Frequência
            </Link>
            <Link href="/professor/horarios" className={styles.navLink}>
              <i className="ti ti-clock" aria-hidden="true" />
              Horários
            </Link>
          </nav>

          <div className={styles.sidebarFooter}>
            <div>
              <span className={styles.infoCardHeader}>
                <span className={styles.infoCardSeal}>F</span>
                <span className={styles.studentName}>{nomeCompleto}</span>
              </span>
            </div>
          </div>
        </aside>

        {menuOpen && (
          <button
            className={styles.overlay}
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <div className={styles.content}>
          <header className={styles.topbar}>
            <button
              className={styles.menuButton}
              aria-label="Abrir menu"
              onClick={() => setMenuOpen(true)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            <span className={styles.topbarTitle}>Minhas turmas</span>
          </header>

          <main className={styles.main}>
            <h1 className={styles.greeting}>Minhas turmas</h1>
            <p className={styles.subtitle}>
              Olá, {firstName}. Aqui estão as turmas e disciplinas que você leciona.
            </p>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}

            {turmas.length === 0 ? (
              <p className={styles.alunosEmpty}>Nenhuma turma encontrada para este professor.</p>
            ) : (
              <ul className={styles.turmasList}>
                {turmas.map((turma) => (
                  <li key={turma.id}>
                    <Link
                      href={`/professor/turmas/${turma.id}`}
                      className={styles.turmaItem}
                    >
                      <span className={styles.turmaIcon}>
                        <i className="ti ti-users" aria-hidden="true" />
                      </span>
                      <span className={styles.turmaInfo}>
                        <span className={styles.turmaNome}>{turma.turma}</span>
                        <span className={styles.turmaDisciplina}>{turma.disciplina_lecionada}</span>
                      </span>
                      <span className={styles.turmaArrow} aria-hidden="true">→</span>
                    </Link>
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