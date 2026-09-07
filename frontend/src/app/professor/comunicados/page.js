"use client";

import logo from "../../../assets/logo.png";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import layoutStyles from "../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function ComunicadosPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [comunicados, setComunicados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erros, setErros] = useState([]);
  const router = useRouter();

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

        // Reaproveita o mesmo endpoint usado pela coordenação para listar
        // comunicados, filtrando aqui só os emitidos pela coordenação.
        const comunicadosRes = await fetch(`${API_BASE}/api/coordenacao/comunicados`);
        if (!comunicadosRes.ok) throw new Error(`Falha ao buscar comunicados (status ${comunicadosRes.status})`);
        const comunicadosData = await comunicadosRes.json();

        const apenasCoordenacao = (comunicadosData.comunicados || []).filter(
          (c) => c.origem === "coordenacao"
        );
        setComunicados(apenasCoordenacao);
      } catch (error) {
        setErros([`Erro ao carregar dados: ${error.message}`]);
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
          <p className={layoutStyles.loadingText}>Carregando comunicados…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  const firstName = nomeCompleto.split(" ")[0];

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
            <Link href="/professor/comunicados" className={layoutStyles.navLinkActive}>
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
            <span className={layoutStyles.topbarTitle}>Comunicados</span>
          </header>

          <main className={layoutStyles.main}>
            <div className={styles.headerRow}>
              <div>
                <h1 className={layoutStyles.greeting}>Comunicados</h1>
                <p className={layoutStyles.subtitle}>
                  Avisos enviados pela coordenação, {firstName}.
                </p>
              </div>
            </div>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}

            {carregando ? (
              <p className={styles.subtitle}>Carregando comunicados...</p>
            ) : comunicados.length === 0 ? (
              <p className={styles.vazio}>Nenhum comunicado da coordenação até o momento.</p>
            ) : (
              <ul className={styles.comunicadosList}>
                {comunicados.map((c) => (
                  <li key={c.id} className={styles.comunicadoCard}>
                    <div className={styles.comunicadoIcone}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 9h8" />
                        <path d="M8 13h6" />
                        <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3z" />
                      </svg>
                    </div>
                    <div className={styles.comunicadoInfo}>
                      <div className={styles.comunicadoTopo}>
                        <p className={styles.comunicadoTitulo}>{c.titulo}</p>
                        <span className={styles.comunicadoData}>{formatarData(c.data)}</span>
                      </div>
                      {c.nome_turma ? (
                        <span className={styles.comunicadoTurmaBadge}>{c.nome_turma}</span>
                      ) : (
                        <span className={styles.comunicadoGeralBadge}>Geral</span>
                      )}
                      <p className={styles.comunicadoMensagem}>{c.mensagem}</p>
                    </div>
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