"use client";

import logo from "../../../assets/logo.png";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import layoutStyles from "../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

const DIAS = ["SEG", "TER", "QUA", "QUI", "SEX"];
const DIAS_LABEL = { SEG: "Segunda", TER: "Terça", QUA: "Quarta", QUI: "Quinta", SEX: "Sexta" };

export default function HorariosProfessorPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [horarios, setHorarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erros, setErros] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`, { credentials: "include" });
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/professor/login");
          return;
        }
        setAuthenticated(true);
        setNomeCompleto(authData.teacher.nome_completo);

        const res = await fetch(`${API_BASE}/api/teacher/horarios`, { credentials: "include" });
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

  const firstName = nomeCompleto.split(" ")[0];

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
            <Link href="/professor/horarios" className={layoutStyles.navLinkActive}>
              <i className="ti ti-clock" aria-hidden="true" />
              Horários
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
            <span className={layoutStyles.topbarTitle}>Horários</span>
          </header>

          <main className={layoutStyles.main}>
            <h1 className={layoutStyles.greeting}>Horários</h1>
            <p className={layoutStyles.subtitle}>
              Grade de aulas das turmas em que você leciona, {firstName}.
            </p>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}

            {carregando ? (
              <p className={styles.subtitle}>Carregando...</p>
            ) : horarios.length === 0 ? (
              <p className={styles.vazio}>Nenhum horário atribuído a você ainda.</p>
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
                          <span className={styles.aulaTurma}>{h.turma}</span>
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