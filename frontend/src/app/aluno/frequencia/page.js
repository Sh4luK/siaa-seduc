"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import logo from "../../../assets/logo.png";
import layoutStyles from "../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function diasNoMes(ano, mes) {
  return new Date(ano, mes, 0).getDate();
}

function diaSemanaDoPrimeiro(ano, mes) {
  return new Date(ano, mes - 1, 1).getDay();
}

export default function FrequenciaAlunoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [turma, setTurma] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  const router = useRouter();

  const carregarFrequencia = useCallback(async (m, a) => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`${API_BASE}/api/students/frequencia?mes=${m}&ano=${a}`);
      if (!res.ok) throw new Error(`Falha ao buscar frequência (status ${res.status})`);
      const data = await res.json();
      setDados(data);
      setDiaSelecionado(null);
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

        await carregarFrequencia(mes, ano);
      } catch (error) {
        setErro(`Erro ao carregar dados: ${error.message}`);
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function trocarMes(delta) {
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes > 12) {
      novoMes = 1;
      novoAno += 1;
    } else if (novoMes < 1) {
      novoMes = 12;
      novoAno -= 1;
    }
    setMes(novoMes);
    setAno(novoAno);
    carregarFrequencia(novoMes, novoAno);
  }

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}>
            <span className={layoutStyles.loadingBarFill} />
          </div>
          <p className={layoutStyles.loadingText}>Carregando frequência…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  const totalDias = diasNoMes(ano, mes);
  const offset = diaSemanaDoPrimeiro(ano, mes);
  const mapaDias = {};
  (dados?.dias || []).forEach((d) => {
    mapaDias[d.data] = d;
  });

  const celulas = [];
  for (let i = 0; i < offset; i++) celulas.push(null);
  for (let dia = 1; dia <= totalDias; dia++) {
    const dataStr = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    celulas.push({ dia, dataStr, info: mapaDias[dataStr] || null });
  }

  const diaInfoSelecionado = diaSelecionado ? mapaDias[diaSelecionado] : null;

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
            <Link href="/aluno/frequencia" className={layoutStyles.navLinkActive}>
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
            <span className={layoutStyles.topbarTitle}>Frequência</span>
          </header>

          <main className={layoutStyles.main}>
            <h1 className={layoutStyles.greeting}>Frequência</h1>
            <p className={layoutStyles.subtitle}>Faltas e presenças registradas pelos professores.</p>

            {erro && <p className={styles.erro}>{erro}</p>}

            <div className={styles.resumoRow}>
              <div className={styles.resumoCard}>
                <span className={styles.resumoValor}>{dados?.total_registros ?? "—"}</span>
                <span className={styles.resumoLabel}>Aulas no mês</span>
              </div>
              <div className={`${styles.resumoCard} ${styles.resumoVerde}`}>
                <span className={styles.resumoValor}>{dados?.total_presencas ?? "—"}</span>
                <span className={styles.resumoLabel}>Presenças</span>
              </div>
              <div className={`${styles.resumoCard} ${styles.resumoVermelho}`}>
                <span className={styles.resumoValor}>{dados?.total_faltas ?? "—"}</span>
                <span className={styles.resumoLabel}>Faltas</span>
              </div>
              <div className={styles.resumoCard}>
                <span className={styles.resumoValor}>
                  {dados?.percentual_presenca != null ? `${dados.percentual_presenca}%` : "—"}
                </span>
                <span className={styles.resumoLabel}>Presença no mês</span>
              </div>
            </div>

            <div className={styles.calendarioHeader}>
              <button className={styles.navBtn} onClick={() => trocarMes(-1)} aria-label="Mês anterior">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className={styles.mesAtual}>{MESES[mes - 1]} de {ano}</span>
              <button className={styles.navBtn} onClick={() => trocarMes(1)} aria-label="Próximo mês">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {carregando ? (
              <p className={styles.subtitle}>Carregando...</p>
            ) : (
              <div className={styles.calendarioWrapper}>
                <div className={styles.diasSemanaHeader}>
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                    <span key={d} className={styles.diaSemanaLabel}>{d}</span>
                  ))}
                </div>
                <div className={styles.grade}>
                  {celulas.map((c, i) => {
                    if (!c) return <div key={`vazio-${i}`} className={styles.celulaVazia} />;

                    let classeStatus = styles.semRegistro;
                    if (c.info) {
                      if (c.info.situacao === "presente") classeStatus = styles.diaPresente;
                      else if (c.info.situacao === "falta_parcial") classeStatus = styles.diaFaltaParcial;
                      else classeStatus = styles.diaFalta;
                    }

                    return (
                      <button
                        key={c.dataStr}
                        className={`${styles.celulaDia} ${classeStatus} ${diaSelecionado === c.dataStr ? styles.celulaSelecionada : ""
                          }`}
                        onClick={() => c.info && setDiaSelecionado(c.dataStr)}
                        disabled={!c.info}
                      >
                        {c.dia}
                      </button>
                    );
                  })}
                </div>

                <div className={styles.legenda}>
                  <span className={styles.legendaItem}><span className={`${styles.legendaBolinha} ${styles.diaPresente}`} /> Presença total</span>
                  <span className={styles.legendaItem}><span className={`${styles.legendaBolinha} ${styles.diaFaltaParcial}`} /> Falta parcial</span>
                  <span className={styles.legendaItem}><span className={`${styles.legendaBolinha} ${styles.diaFalta}`} /> Falta total</span>
                </div>
              </div>
            )}

            {diaInfoSelecionado && (
              <div className={styles.detalheDia}>
                <div className={styles.detalheHeader}>
                  Detalhes de {diaSelecionado.split("-").reverse().join("/")}
                </div>
                <ul className={styles.detalheLista}>
                  {diaInfoSelecionado.aulas.map((a, i) => (
                    <li key={i} className={styles.detalheItem}>
                      <span>{a.disciplina || "Disciplina"}</span>
                      <span className={a.presente ? styles.badgePresente : styles.badgeFalta}>
                        {a.presente ? "Presente" : "Falta"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}