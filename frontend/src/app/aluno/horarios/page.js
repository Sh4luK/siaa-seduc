"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import logo from "../../../assets/logo.png";
import layoutStyles from "../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

const DIAS = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA"];
const DIAS_LABEL = { SEGUNDA: "Segunda", TERCA: "Terça", QUARTA: "Quarta", QUINTA: "Quinta", SEXTA: "Sexta" };

export default function HorariosAlunoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [turma, setTurma] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [horarios, setHorarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erros, setErros] = useState([]);
  const router = useRouter();

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

        const res = await fetch(`${API_BASE}/api/students/horarios`);
        if (!res.ok) throw new Error(`Falha ao buscar horários (status ${res.status})`);
        const data = await res.json();
        setHorarios(data.horarios || []);
      } catch (error) {
        setErros([`Erro ao carregar horários: ${error.message}`]);
      } finally {
        setLoading(false);
        setCarregando(false);
      }
    }
    init();
  }, [router]);

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}>
            <span className={layoutStyles.loadingBarFill} />
          </div>
          <p className={layoutStyles.loadingText}>Carregando horários…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  const porDia = DIAS.reduce((acc, dia) => {
    acc[dia] = horarios
      .filter((h) => h.dia_semana === dia)
      .sort((a, b) => (a.hora_inicio || "").localeCompare(b.hora_inicio || ""));
    return acc;
  }, {});

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
            <Link href="/aluno/horarios" className={layoutStyles.navLinkActive}>
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
            <span className={layoutStyles.topbarTitle}>Horários</span>
          </header>

          <main className={layoutStyles.main}>
            <h1 className={layoutStyles.greeting}>Horários</h1>
            <p className={layoutStyles.subtitle}>Grade de aulas da sua turma.</p>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}

            {carregando ? (
              <p className={styles.subtitle}>Carregando...</p>
            ) : horarios.length === 0 ? (
              <p className={styles.vazio}>Nenhum horário cadastrado para sua turma.</p>
            ) : (
              <div className={styles.gradeSemana}>
                {DIAS.map((dia) => (
                  <div key={dia} className={styles.diaColuna}>
                    <div className={styles.diaHeader}>{DIAS_LABEL[dia]}</div>
                    {porDia[dia].length === 0 ? (
                      <p className={styles.diaVazio}>—</p>
                    ) : (
                      porDia[dia].map((h) => (
                        <div key={h.id} className={styles.aulaCard}>
                          <span className={styles.aulaHorario}>{h.hora_inicio} – {h.hora_fim}</span>
                          <span className={styles.aulaDisciplina}>{h.disciplina}</span>
                          {h.professor_nome && (
                            <span className={styles.aulaProfessor}>{h.professor_nome}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}