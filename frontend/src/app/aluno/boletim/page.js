"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import logo from "../../../assets/logo.png";
import layoutStyles from "../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function corDaNota(valor) {
  if (valor === "" || valor === null || valor === undefined) return "";
  const numero = Number(valor);
  if (Number.isNaN(numero)) return "";
  return numero < 6 ? styles.notaBaixa : styles.notaAlta;
}

export default function BoletimAlunoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [turma, setTurma] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [boletim, setBoletim] = useState([]);
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

        const res = await fetch(`${API_BASE}/api/students/boletim`);
        if (!res.ok) throw new Error(`Falha ao buscar boletim (status ${res.status})`);
        const data = await res.json();
        setBoletim(data.boletim || []);
      } catch (error) {
        setErros([`Erro ao carregar boletim: ${error.message}`]);
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
          <p className={layoutStyles.loadingText}>Carregando boletim…</p>
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
            <Link href="/aluno/boletim" className={layoutStyles.navLinkActive}>
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
            <span className={layoutStyles.topbarTitle}>Boletim</span>
          </header>

          <main className={layoutStyles.main}>
            <h1 className={layoutStyles.greeting}>Boletim</h1>
            <p className={layoutStyles.subtitle}>Suas notas por disciplina.</p>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}

            {carregando ? (
              <p className={styles.subtitle}>Carregando...</p>
            ) : boletim.length === 0 ? (
              <p className={styles.vazio}>Nenhuma nota lançada ainda.</p>
            ) : (
              <div className={styles.tabelaWrapper}>
                <table className={styles.tabela}>
                  <thead>
                    <tr>
                      <th className={styles.stickyCol} rowSpan={2}>Disciplina</th>
                      <th colSpan={4}>1º Trimestre</th>
                      <th colSpan={4}>2º Trimestre</th>
                      <th colSpan={4}>3º Trimestre</th>
                      <th rowSpan={2}>MA</th>
                      <th rowSpan={2}>PF</th>
                      <th rowSpan={2}>MAF</th>
                      <th rowSpan={2}>RF</th>
                    </tr>
                    <tr>
                      <th>NM1</th><th>NM2</th><th>NM3</th><th>MT</th>
                      <th>NM1</th><th>NM2</th><th>NM3</th><th>MT</th>
                      <th>NM1</th><th>NM2</th><th>NM3</th><th>MT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boletim.map((n, i) => (
                      <tr key={i}>
                        <td className={styles.stickyCol}>{n.disciplina}</td>
                        <td className={corDaNota(n.nm1_t1)}>{n.nm1_t1 ?? "—"}</td>
                        <td className={corDaNota(n.nm2_t1)}>{n.nm2_t1 ?? "—"}</td>
                        <td className={corDaNota(n.nm3_t1)}>{n.nm3_t1 ?? "—"}</td>
                        <td className={corDaNota(n.mt_t1)}>{n.mt_t1 ?? "—"}</td>
                        <td className={corDaNota(n.nm1_t2)}>{n.nm1_t2 ?? "—"}</td>
                        <td className={corDaNota(n.nm2_t2)}>{n.nm2_t2 ?? "—"}</td>
                        <td className={corDaNota(n.nm3_t2)}>{n.nm3_t2 ?? "—"}</td>
                        <td className={corDaNota(n.mt_t2)}>{n.mt_t2 ?? "—"}</td>
                        <td className={corDaNota(n.nm1_t3)}>{n.nm1_t3 ?? "—"}</td>
                        <td className={corDaNota(n.nm2_t3)}>{n.nm2_t3 ?? "—"}</td>
                        <td className={corDaNota(n.nm3_t3)}>{n.nm3_t3 ?? "—"}</td>
                        <td className={corDaNota(n.mt_t3)}>{n.mt_t3 ?? "—"}</td>
                        <td>
                          <span className={`${styles.calculadoBadge} ${corDaNota(n.ma)}`}>{n.ma ?? "—"}</span>
                        </td>
                        <td className={corDaNota(n.pf)}>{n.pf ?? "—"}</td>
                        <td>
                          <span className={`${styles.calculadoBadge} ${corDaNota(n.maf)}`}>{n.maf ?? "—"}</span>
                        </td>
                        <td>{n.rf ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}