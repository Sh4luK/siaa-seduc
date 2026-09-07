"use client";

import logo from "../../../../assets/logo.png"
import Image from "next/image"
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import layoutStyles from "../../page.module.css"
import styles from "./turma.module.css"

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function TurmaPage() {
  const [authenticated, setAuthenticated] = useState(null)
  const { turmaId } = useParams();
  const [turma, setTurma] = useState(null);
  const [turmaLength, setTurmaLength] = useState(0)
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function verifyAuthentication() {
      try {
        const response = await fetch(`${API_BASE}/api/teacher/auth`);
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
        const authResponse = await fetch(`${API_BASE}/api/teacher/auth`);
        if (!authResponse.ok) throw new Error();
        const data = await authResponse.json();
        const nome = data["teacher"]["nome_completo"] || "Não encontrado.";
        setNomeCompleto(nome);
        return nome
      } catch (error) {
        setNomeCompleto("Erro ao carregar.");
        return null;
      }
    }

    async function getTurma() {
      try {
        const response = await fetch(`${API_BASE}/api/teacher/search/turma?turma=${turmaId}`)
        if (!response.ok) throw new Error()
        const data = await response.json()
        setTurma(data["turma"])
      } catch (error) {
        setTurma(null)
      }
    }

    async function getTotalAlunos() {
      try {
        const turmaRes = await fetch(`${API_BASE}/api/teacher/search/turma?turma=${turmaId}`)
        if (!turmaRes.ok) throw new Error()
        const turmaData = await turmaRes.json()
        const nomeTurma = turmaData.turma?.turma
        if (!nomeTurma) throw new Error()

        const alunosRes = await fetch(
          `${API_BASE}/api/teacher/get/alunos?turma=${encodeURIComponent(nomeTurma)}`
        )
        if (!alunosRes.ok) throw new Error()
        const alunosData = await alunosRes.json()

        setTurmaLength(alunosData.total || 0)
      } catch (error) {
        setTurmaLength(0)
      }
    }

    async function init() {
      await verifyAuthentication();
      await getData();
      await getTurma()
      await getTotalAlunos()
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
    const nomeTurma = turma?.turma || "Turma";
    const etapa = turma?.etapa || "";
    const disciplina = turma?.disciplina_lecionada || "";
    const escola = turma?.escola || "";

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
              <Link href="/professor/frequencia" className={layoutStyles.navLink}>
                <i className="ti ti-clipboard-check" aria-hidden="true" />
                Frequência
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
              <span className={layoutStyles.topbarTitle}>Painel da turma</span>
            </header>

            <main className={layoutStyles.main}>
              <Link href="/professor/turmas" className={styles.voltarLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6l-6 6l6 6" />
                </svg>
                Minhas turmas
              </Link>

              <div className={styles.turmaHero}>
                <div className={styles.turmaHeroSelo}>
                  {etapa?.charAt(0) || "?"}ª
                </div>
                <div className={styles.turmaHeroInfo}>
                  <h1 className={styles.turmaHeroNome}>{nomeTurma}</h1>
                  <p className={styles.turmaHeroDetalhe}>
                    {etapa}{escola && ` · ${escola}`}
                  </p>
                  {disciplina && (
                    <span className={styles.turmaHeroChip}>{disciplina}</span>
                  )}
                </div>
              </div>

              <section className={styles.acoesGrid}>
                <Link href={`/professor/turmas/${turmaId}/alunos`} className={styles.acaoCard}>
                  <span className={`${styles.acaoIcone} ${styles.corAzul}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                      <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
                    </svg>
                  </span>
                  <p className={styles.acaoTitulo}>Lista de alunos</p>
                  <p className={styles.acaoValor}>{turmaLength}</p>
                  <p className={styles.acaoLegenda}>aluno(s) matriculado(s)</p>
                </Link>

                <Link href={`/professor/notas/${turmaId}`} className={styles.acaoCard}>
                  <span className={`${styles.acaoIcone} ${styles.corRoxo}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
                      <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
                    </svg>
                  </span>
                  <p className={styles.acaoTitulo}>Lançar notas</p>
                  <p className={styles.acaoLegenda}>Registrar notas trimestrais</p>
                </Link>

                <Link href={`/professor/frequencia/turma/${turmaId}`} className={styles.acaoCard}>
                  <span className={`${styles.acaoIcone} ${styles.corVerde}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
                      <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
                      <path d="M9 14l2 2l4 -4" />
                    </svg>
                  </span>
                  <p className={styles.acaoTitulo}>Frequência</p>
                  <p className={styles.acaoLegenda}>Registrar presença e falta</p>
                </Link>

                <div className={`${styles.acaoCard} ${styles.acaoDesabilitada}`}>
                  <span className={`${styles.acaoIcone} ${styles.corLaranja}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6" />
                    </svg>
                  </span>
                  <p className={styles.acaoTitulo}>Notificações</p>
                  <p className={styles.acaoLegenda}>Em breve</p>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    );
  }
  return null
}