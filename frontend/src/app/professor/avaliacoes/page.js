"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";
import layoutStyles from "./page.module.css";
import styles from "./avaliacoes.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function AvaliacoesPage() {
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [erros, setErros] = useState([]);

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
        setNomeCompleto(authData.teacher?.nome_completo || "");

        const res = await fetch(`${API_BASE}/api/teacher/avaliacoes`);
        if (!res.ok) {
          const corpoErro = await res.text();
          let msg = `Falha ao buscar avaliações (status ${res.status})`;
          try {
            const json = JSON.parse(corpoErro);
            if (json.message) msg = json.message;
          } catch {}
          throw new Error(msg);
        }

        const data = await res.json();
        setAvaliacoes(data.avaliacoes || []);
      } catch (error) {
        setAuthenticated(false);
        setErros([`Erro ao carregar avaliações: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  function emitirPdf(id) {
    window.open(`${API_BASE}/api/teacher/avaliacoes/${id}/pdf`, "_blank");
  }

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

  if (authenticated !== true) return null;

  const iniciais = nomeCompleto
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

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
            <Link href="/professor/comunicados" className={layoutStyles.navLink}>
              <i className="ti ti-message" aria-hidden="true" />
              Comunicados
            </Link>
            <Link href="/professor/atividades" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Atividades
            </Link>
            <Link href="/professor/avaliacoes" className={layoutStyles.navLinkActive}>
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
                <span className={layoutStyles.infoCardSeal}>{iniciais.charAt(0)}</span>
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
            <span className={layoutStyles.topbarTitle}>Avaliações</span>
          </header>

          <main className={layoutStyles.main}>
            <div className={styles.headerRow}>
              <div>
                <h1 className={layoutStyles.greeting}>Avaliações</h1>
                <p className={layoutStyles.subtitle}>Gerencie as avaliações criadas por você.</p>
              </div>
              <Link href="/professor/avaliacoes/novo" className={styles.novoBotao}>
                + Nova avaliação
              </Link>
            </div>

            {erros.length > 0 && (
              <div className={layoutStyles.errorBox}>
                <span className={layoutStyles.errorIcon}>!</span>
                <span>{erros[0]}</span>
              </div>
            )}

            {avaliacoes.length === 0 ? (
              <p className={layoutStyles.vazio}>Nenhuma avaliação cadastrada ainda.</p>
            ) : (
              <div className={styles.grid}>
                {avaliacoes.map((a) => (
                  <div key={a.id} className={styles.card}>
                    <Link href={`/professor/avaliacoes/${a.id}`} className={styles.cardLink}>
                      <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitulo}>{a.titulo}</h3>
                        <span className={styles.cardData}>
                          {new Date(a.data).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className={styles.cardLinha}>
                        <strong>Disciplina:</strong> {a.disciplina}
                      </p>
                      <p className={styles.cardLinha}>
                        <strong>Turma:</strong> {a.turma}
                      </p>
                      <p className={styles.cardMeta}>{a.total_questoes} questões</p>
                    </Link>

                    <button className={styles.pdfBotao} onClick={() => emitirPdf(a.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                        <path d="M5 3h9l5 5v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z" />
                        <path d="M9 12h6" />
                        <path d="M9 16h6" />
                      </svg>
                      Emitir PDF
                    </button>
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