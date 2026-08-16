"use client";

import logo from "../../../assets/logo.png"
import Image from "next/image"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import layoutStyles from "../page.module.css"
import styles from "./page.module.css"

const API_BASE = "http://127.0.0.1:8000";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function hoje() {
  return new Date();
}

export default function CalendarioPage() {
  const [authenticated, setAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("")
  const [professorId, setProfessorId] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mesAtual, setMesAtual] = useState(hoje().getMonth() + 1) // 1-12
  const [anoAtual, setAnoAtual] = useState(hoje().getFullYear())
  const [eventos, setEventos] = useState([])
  const [carregandoEventos, setCarregandoEventos] = useState(false)
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

    async function carregarEventos() {
      setCarregandoEventos(true);
      setErros([]);

      try {
        const mesFormatado = String(mesAtual).padStart(2, "0");
        const url = `${API_BASE}/api/teacher/calendario/eventos?professor=${professorId}&mes=${mesFormatado}&ano=${anoAtual}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Falha ao buscar eventos (status ${res.status})`);
        const data = await res.json();

        setEventos(data.eventos || []);
      } catch (error) {
        setErros([`Erro ao carregar eventos: ${error.message}`]);
      } finally {
        setCarregandoEventos(false);
      }
    }

    carregarEventos();
  }, [professorId, mesAtual, anoAtual]);

  function mesAnterior() {
    if (mesAtual === 1) {
      setMesAtual(12);
      setAnoAtual((a) => a - 1);
    } else {
      setMesAtual((m) => m - 1);
    }
  }

  function proximoMes() {
    if (mesAtual === 12) {
      setMesAtual(1);
      setAnoAtual((a) => a + 1);
    } else {
      setMesAtual((m) => m + 1);
    }
  }

  async function handleDeletar(eventoId) {
    setDeletandoId(eventoId);
    try {
      const res = await fetch(
        `${API_BASE}/api/teacher/calendario/eventos/${eventoId}/deletar`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`Falha ao remover (status ${res.status})`);

      setEventos((prev) => prev.filter((e) => e.id !== eventoId));
    } catch (error) {
      setErros([`Erro ao remover evento: ${error.message}`]);
    } finally {
      setDeletandoId(null);
    }
  }

  const eventosPorDia = useMemo(() => {
    const mapa = {};
    for (const evento of eventos) {
      const dia = Number(evento.data.split("-")[2]);
      if (!mapa[dia]) mapa[dia] = [];
      mapa[dia].push(evento);
    }
    return mapa;
  }, [eventos]);

  const diasNoMes = new Date(anoAtual, mesAtual, 0).getDate();
  const primeiroDiaSemana = new Date(anoAtual, mesAtual - 1, 1).getDay();
  const celulasVazias = Array.from({ length: primeiroDiaSemana });
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1);

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}>
            <span className={layoutStyles.loadingBarFill} />
          </div>
          <p className={layoutStyles.loadingText}>Carregando calendário…</p>
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
            <Link href="/professor/calendario" className={layoutStyles.navLinkActive}>
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
            <span className={layoutStyles.topbarTitle}>Calendário Escolar</span>
          </header>

          <main className={layoutStyles.main}>
            <div className={styles.headerRow}>
              <div>
                <h1 className={layoutStyles.greeting}>Calendário escolar</h1>
                <p className={layoutStyles.subtitle}>
                  Eventos e datas importantes, {firstName}.
                </p>
              </div>
              <Link href="/professor/calendario/novo" className={styles.novoBotao}>
                + Novo evento
              </Link>
            </div>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}

            <div className={styles.navegacaoMes}>
              <button className={styles.navMesBotao} onClick={mesAnterior} aria-label="Mês anterior">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6l-6 6l6 6" />
                </svg>
              </button>
              <span className={styles.mesLabel}>{MESES[mesAtual - 1]} de {anoAtual}</span>
              <button className={styles.navMesBotao} onClick={proximoMes} aria-label="Próximo mês">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </button>
            </div>

            {carregandoEventos ? (
              <p className={styles.subtitle}>Carregando eventos...</p>
            ) : (
              <>
                <div className={styles.calendarioGrid}>
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
                    <div key={dia} className={styles.diaSemanaLabel}>{dia}</div>
                  ))}

                  {celulasVazias.map((_, i) => (
                    <div key={`vazio-${i}`} className={styles.diaCelulaVazia} />
                  ))}

                  {dias.map((dia) => {
                    const eventosDoDia = eventosPorDia[dia] || [];
                    const isHoje =
                      dia === hoje().getDate() &&
                      mesAtual === hoje().getMonth() + 1 &&
                      anoAtual === hoje().getFullYear();

                    return (
                      <div
                        key={dia}
                        className={`${styles.diaCelula} ${isHoje ? styles.diaCelulaHoje : ""}`}
                      >
                        <span className={styles.diaNumero}>{dia}</span>
                        {eventosDoDia.map((evento) => (
                          <div key={evento.id} className={styles.eventoTag} title={evento.titulo}>
                            {evento.titulo}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                <div className={styles.listaEventosSection}>
                  <h2 className={styles.listaEventosTitulo}>Eventos do mês</h2>

                  {eventos.length === 0 ? (
                    <p className={styles.vazio}>Nenhum evento cadastrado para este mês.</p>
                  ) : (
                    <ul className={styles.eventosList}>
                      {eventos
                        .slice()
                        .sort((a, b) => a.data.localeCompare(b.data))
                        .map((evento) => (
                          <li key={evento.id} className={styles.eventoCard}>
                            <div className={styles.eventoCardData}>
                              {evento.data.split("-")[2]}
                              <span>{MESES[Number(evento.data.split("-")[1]) - 1].slice(0, 3)}</span>
                            </div>
                            <div className={styles.eventoCardInfo}>
                              <p className={styles.eventoCardTitulo}>{evento.titulo}</p>
                              {evento.nome_turma && (
                                <p className={styles.eventoCardTurma}>{evento.nome_turma}</p>
                              )}
                              {evento.descricao && (
                                <p className={styles.eventoCardDescricao}>{evento.descricao}</p>
                              )}
                            </div>
                            <button
                              className={styles.eventoDeletar}
                              onClick={() => handleDeletar(evento.id)}
                              disabled={deletandoId === evento.id}
                              aria-label="Remover evento"
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
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}