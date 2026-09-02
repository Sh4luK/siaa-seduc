"use client";

import logo from "../../../../assets/logo.png";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import layoutStyles from "../../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatarDataSeparador(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function ConversaProfessorPage() {
  const router = useRouter();
  const params = useParams();
  const conversaId = params.conversaId;

  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fimDaListaRef = useRef(null);

  const carregarConversa = useCallback(async () => {
    setErro(null);
    try {
      const res = await fetch(`${API_BASE}/api/professor/mensagens/${conversaId}`, {
        credentials: "include",
      });
      if (res.status === 404) throw new Error("Conversa não encontrada.");
      if (!res.ok) throw new Error(`Falha ao buscar conversa (status ${res.status})`);
      const data = await res.json();
      setMensagens(data.mensagens);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [conversaId]);

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
        setLoading(false);
        carregarConversa();
      } catch (error) {
        setErro(`Erro ao carregar dados: ${error.message}`);
        setLoading(false);
      }
    }

    init();
  }, [router, carregarConversa]);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function handleEnviar(e) {
    e.preventDefault();
    if (!novaMensagem.trim() || enviando) return;

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/professor/mensagens/${conversaId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: novaMensagem.trim() }),
      });
      if (!res.ok) throw new Error(`Falha ao enviar mensagem (status ${res.status})`);
      const mensagemCriada = await res.json();
      setMensagens((atual) => [...atual, mensagemCriada]);
      setNovaMensagem("");
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}>
            <span className={layoutStyles.loadingBarFill} />
          </div>
          <p className={layoutStyles.loadingText}>Carregando conversa…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  const firstName = nomeCompleto.split(" ")[0];
  let ultimaDataExibida = null;

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
            <Link href="/professor/mensagem" className={layoutStyles.navLinkActive}>
              <i className="ti ti-messages" aria-hidden="true" />
              Mensagens
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
            <span className={layoutStyles.topbarTitle}>Conversa com a coordenação</span>
          </header>

          <main className={styles.main}>
            <div className={styles.cabecalho}>
              <Link href="/professor/mensagem" className={styles.voltar}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </Link>
              <h1 className={styles.titulo}>Coordenação</h1>
            </div>

            {erro && (
              <div className={styles.erro}>
                {erro}
                <button onClick={carregarConversa} className={styles.tentarNovamente}>
                  Tentar novamente
                </button>
              </div>
            )}

            <div className={styles.corpo}>
              {carregando && !erro && (
                <p className={styles.estadoVazio}>Carregando mensagens...</p>
              )}

              {!carregando && !erro && mensagens.length === 0 && (
                <p className={styles.estadoVazio}>Nenhuma mensagem ainda.</p>
              )}

              {!carregando &&
                mensagens.map((msg) => {
                  const dataMsg = formatarDataSeparador(msg.data_envio);
                  const mostrarSeparador = dataMsg !== ultimaDataExibida;
                  ultimaDataExibida = dataMsg;
                  const éProfessor = msg.remetente_tipo === "PROFESSOR";

                  return (
                    <div key={msg.id}>
                      {mostrarSeparador && (
                        <div className={styles.separadorData}>{dataMsg}</div>
                      )}
                      <div className={éProfessor ? styles.bolhaEnviada : styles.bolhaRecebida}>
                        <p className={styles.bolhaTexto}>{msg.conteudo}</p>
                        <span className={styles.bolhaHora}>{formatarHora(msg.data_envio)}</span>
                      </div>
                    </div>
                  );
                })}
              <div ref={fimDaListaRef} />
            </div>

            <form className={styles.rodape} onSubmit={handleEnviar}>
              <input
                type="text"
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                placeholder="Escreva uma mensagem..."
                className={styles.input}
                disabled={carregando}
              />
              <button
                type="submit"
                className={styles.enviarBtn}
                disabled={enviando || !novaMensagem.trim() || carregando}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}