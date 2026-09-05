// "use client";

// import logo from "../../../assets/logo.png";
// import Image from "next/image";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useEffect, useState, useCallback } from "react";
// import layoutStyles from "../page.module.css";
// import styles from "./page.module.css";

// const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

// function formatarDataHora(iso) {
//   const data = new Date(iso);
//   const hoje = new Date();
//   const mesmoDia = data.toDateString() === hoje.toDateString();
//   if (mesmoDia) {
//     return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
//   }
//   return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
// }

// export default function MensagensProfessorPage() {
//   const [authenticated, setAuthenticated] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [nomeCompleto, setNomeCompleto] = useState("");
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [conversas, setConversas] = useState([]);
//   const [carregando, setCarregando] = useState(true);
//   const [erros, setErros] = useState([]);
//   const router = useRouter();

//   const carregarConversas = useCallback(async () => {
//     setCarregando(true);
//     try {
//       const res = await fetch(`${API_BASE}/api/professor/mensagens`, {
//         credentials: "include",
//       });
//       if (!res.ok) throw new Error(`Falha ao buscar conversas (status ${res.status})`);
//       const data = await res.json();
//       setConversas(data);
//     } catch (error) {
//       setErros([`Erro ao carregar conversas: ${error.message}`]);
//     } finally {
//       setCarregando(false);
//     }
//   }, []);

//   // mantenha carregarConversas como está

//   const atualizarConversasSilenciosamente = useCallback(async () => {
//     try {
//       const res = await fetch(`${API_BASE}/api/professor/mensagens`, {
//         credentials: "include",
//       });
//       if (!res.ok) return;
//       const data = await res.json();
//       setConversas(data);
//     } catch {
//       // ignora falhas de polling silenciosamente
//     }
//   }, []);

//   // novo useEffect — adicione junto ao init existente
//   useEffect(() => {
//     if (loading) return;
//     const intervalo = setInterval(atualizarConversasSilenciosamente, 6000);
//     return () => clearInterval(intervalo);
//   }, [loading, atualizarConversasSilenciosamente]);

//   useEffect(() => {
//     async function init() {
//       try {
//         const authRes = await fetch(`${API_BASE}/api/teacher/auth`);
//         const authData = await authRes.json();

//         if (!authData.return) {
//           setAuthenticated(false);
//           router.push("/professor/login");
//           return;
//         }
//         setAuthenticated(true);
//         setNomeCompleto(authData.teacher.nome_completo);
//         setLoading(false);
//         carregarConversas();
//       } catch (error) {
//         setErros([`Erro ao carregar dados: ${error.message}`]);
//         setLoading(false);
//       }
//     }

//     init();
//   }, [router, carregarConversas]);

//   if (loading) {
//     return (
//       <div className={layoutStyles.page}>
//         <div className={layoutStyles.loadingWrap}>
//           <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
//           <div className={layoutStyles.loadingBar}>
//             <span className={layoutStyles.loadingBarFill} />
//           </div>
//           <p className={layoutStyles.loadingText}>Carregando mensagens…</p>
//         </div>
//       </div>
//     );
//   }

//   if (authenticated !== true) return null;

//   const firstName = nomeCompleto.split(" ")[0];

//   return (
//     <div className={layoutStyles.page}>
//       <div className={layoutStyles.topBarInstitucional}>
//         <span>Governo do Estado do Piauí</span>
//         <span className={layoutStyles.topBarDivider} aria-hidden="true" />
//         <span>Secretaria de Estado da Educação</span>
//       </div>

//       <div className={layoutStyles.shell}>
//         <aside className={`${layoutStyles.sidebar} ${menuOpen ? layoutStyles.sidebarOpen : ""}`}>
//           <div className={layoutStyles.sidebarHeader}>
//             <Image src={logo} alt="Logo do SIAA" className={layoutStyles.sidebarLogo} priority />
//             <span className={layoutStyles.sidebarBrand}>SIAA</span>
//           </div>

//           <nav className={layoutStyles.nav}>
//             <Link href="/professor" className={layoutStyles.navLink}>
//               <i className="ti ti-home" aria-hidden="true" />
//               Início
//             </Link>
//             <Link href="/professor/turmas" className={layoutStyles.navLink}>
//               <i className="ti ti-users" aria-hidden="true" />
//               Minhas turmas
//             </Link>
//             <Link href="/professor/calendario" className={layoutStyles.navLink}>
//               <i className="ti ti-users" aria-hidden="true" />
//               Calendario Escolar
//             </Link>
//             <Link href="/professor/frequencia" className={layoutStyles.navLink}>
//               <i className="ti ti-users" aria-hidden="true" />
//               Frequencia
//             </Link>
//             <Link href="/professor/conteudos" className={layoutStyles.navLink}>
//               <i className="ti ti-users" aria-hidden="true" />
//               Conteudos
//             </Link>
//             <Link href="/professor/comunicados" className={layoutStyles.navLink}>
//               <i className="ti ti-message" aria-hidden="true" />
//               Comunicados
//             </Link>
//             <Link href="/professor/mensagem" className={layoutStyles.navLinkActive}>
//               <i className="ti ti-messages" aria-hidden="true" />
//               Mensagens
//             </Link>
//             <Link href="/professor/atividades" className={layoutStyles.navLink}>
//               <i className="ti ti-users" aria-hidden="true" />
//               Atividades
//             </Link>
//             <Link href="/professor/avaliacoes" className={layoutStyles.navLink}>
//               <i className="ti ti-users" aria-hidden="true" />
//               Avaliações
//             </Link>
//             <Link href="/professor/notas" className={layoutStyles.navLink}>
//               <i className="ti ti-edit" aria-hidden="true" />
//               Lançar notas
//             </Link>
//             <Link href="/professor/horarios" className={layoutStyles.navLink}>
//               <i className="ti ti-clock" aria-hidden="true" />
//               Horários
//             </Link>
//           </nav>

//           <div className={layoutStyles.sidebarFooter}>
//             <div>
//               <span className={layoutStyles.infoCardHeader}>
//                 <span className={layoutStyles.infoCardSeal}>{firstName.charAt(0)}</span>
//                 <span className={layoutStyles.studentName}>{nomeCompleto}</span>
//               </span>
//             </div>
//           </div>
//         </aside>

//         {menuOpen && (
//           <button
//             className={layoutStyles.overlay}
//             aria-label="Fechar menu"
//             onClick={() => setMenuOpen(false)}
//           />
//         )}

//         <div className={layoutStyles.content}>
//           <header className={layoutStyles.topbar}>
//             <button
//               className={layoutStyles.menuButton}
//               aria-label="Abrir menu"
//               onClick={() => setMenuOpen(true)}
//             >
//               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//                 <line x1="4" y1="6" x2="20" y2="6" />
//                 <line x1="4" y1="12" x2="20" y2="12" />
//                 <line x1="4" y1="18" x2="20" y2="18" />
//               </svg>
//             </button>
//             <span className={layoutStyles.topbarTitle}>Mensagens</span>
//           </header>

//           <main className={layoutStyles.main}>
//             <div className={styles.headerRow}>
//               <div>
//                 <h1 className={layoutStyles.greeting}>Mensagens</h1>
//                 <p className={layoutStyles.subtitle}>
//                   Conversas com a coordenação, {firstName}.
//                 </p>
//               </div>
//             </div>

//             {erros.length > 0 && (
//               <ul className={layoutStyles.listaErros ?? styles.listaErros}>
//                 {erros.map((e, i) => (
//                   <li key={i}>{e}</li>
//                 ))}
//               </ul>
//             )}

//             {carregando ? (
//               <p className={styles.subtitle}>Carregando conversas...</p>
//             ) : conversas.length === 0 ? (
//               <p className={styles.vazio}>Nenhuma conversa com a coordenação até o momento.</p>
//             ) : (
//               <ul className={styles.conversasList}>
//                 {conversas.map((c) => (
//                   <li key={c.id}>
//                     <Link href={`/professor/mensagem/${c.id}`} className={styles.conversaCard}>
//                       <div className={styles.conversaIcone}>
//                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                           <path d="M8 9h8" />
//                           <path d="M8 13h6" />
//                           <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3z" />
//                         </svg>
//                       </div>
//                       <div className={styles.conversaInfo}>
//                         <div className={styles.conversaTopo}>
//                           <p className={styles.conversaTitulo}>Coordenação</p>
//                           <span className={styles.conversaData}>
//                             {formatarDataHora(c.ultima_atualizacao)}
//                           </span>
//                         </div>
//                         <p className={styles.conversaPrevia}>
//                           {c.ultima_mensagem || "Sem mensagens ainda"}
//                         </p>
//                       </div>
//                       {c.nao_lidas > 0 && (
//                         <span className={styles.badge}>{c.nao_lidas}</span>
//                       )}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import logo from "../../../assets/logo.png";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import layoutStyles from "../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function formatarDataHora(iso) {
  const data = new Date(iso);
  const hoje = new Date();
  if (data.toDateString() === hoje.toDateString()) {
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function MensagensProfessorPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [aba, setAba] = useState("coordenacao"); // "coordenacao" | "responsaveis"
  const [conversasCoordenacao, setConversasCoordenacao] = useState([]);
  const [conversasResponsaveis, setConversasResponsaveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erros, setErros] = useState([]);
  const router = useRouter();

  const carregarTudo = useCallback(async () => {
    setCarregando(true);
    try {
      const [resCoord, resResp] = await Promise.all([
        fetch(`${API_BASE}/api/professor/mensagens`, { credentials: "include" }),
        fetch(`${API_BASE}/api/professor/mensagens/responsaveis`, { credentials: "include" }),
      ]);
      if (resCoord.ok) setConversasCoordenacao(await resCoord.json());
      if (resResp.ok) setConversasResponsaveis(await resResp.json());
    } catch (error) {
      setErros([`Erro ao carregar conversas: ${error.message}`]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/professor/login");
          return;
        }
        setAuthenticated(true);
        setNomeCompleto(authData.teacher.nome_completo);
        setLoading(false);
        carregarTudo();
      } catch (error) {
        setErros([`Erro ao carregar dados: ${error.message}`]);
        setLoading(false);
      }
    }
    init();
  }, [router, carregarTudo]);

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}><span className={layoutStyles.loadingBarFill} /></div>
          <p className={layoutStyles.loadingText}>Carregando mensagens…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  const firstName = nomeCompleto.split(" ")[0];
  const conversasAtivas = aba === "coordenacao" ? conversasCoordenacao : conversasResponsaveis;
  const basePath = aba === "coordenacao" ? "/professor/mensagem" : "/professor/mensagem/responsavel";

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
              <i className="ti ti-home" aria-hidden="true" />Início
            </Link>
            <Link href="/professor/turmas" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />Minhas turmas
            </Link>
            <Link href="/professor/calendario" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />Calendario Escolar
            </Link>
            <Link href="/professor/frequencia" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />Frequencia
            </Link>
            <Link href="/professor/conteudos" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />Conteudos
            </Link>
            <Link href="/professor/comunicados" className={layoutStyles.navLink}>
              <i className="ti ti-message" aria-hidden="true" />Comunicados
            </Link>
            <Link href="/professor/mensagem" className={layoutStyles.navLinkActive}>
              <i className="ti ti-messages" aria-hidden="true" />Mensagens
            </Link>
            <Link href="/professor/atividades" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />Atividades
            </Link>
            <Link href="/professor/avaliacoes" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />Avaliações
            </Link>
            <Link href="/professor/notas" className={layoutStyles.navLink}>
              <i className="ti ti-edit" aria-hidden="true" />Lançar notas
            </Link>
            <Link href="/professor/horarios" className={layoutStyles.navLink}>
              <i className="ti ti-clock" aria-hidden="true" />Horários
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
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            <span className={layoutStyles.topbarTitle}>Mensagens</span>
          </header>

          <main className={layoutStyles.main}>
            <div className={styles.headerRow}>
              <div>
                <h1 className={layoutStyles.greeting}>Mensagens</h1>
                <p className={layoutStyles.subtitle}>Conversas com a coordenação e com responsáveis, {firstName}.</p>
              </div>
            </div>

            <div className={styles.abasRow}>
              <button
                className={aba === "coordenacao" ? styles.abaAtiva : styles.aba}
                onClick={() => setAba("coordenacao")}
              >
                Coordenação
                {conversasCoordenacao.some((c) => c.nao_lidas > 0) && <span className={styles.pontoNaoLido} />}
              </button>
              <button
                className={aba === "responsaveis" ? styles.abaAtiva : styles.aba}
                onClick={() => setAba("responsaveis")}
              >
                Responsáveis
                {conversasResponsaveis.some((c) => c.nao_lidas > 0) && <span className={styles.pontoNaoLido} />}
              </button>
            </div>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>{erros.map((e, i) => <li key={i}>{e}</li>)}</ul>
            )}

            {carregando ? (
              <p className={styles.subtitle}>Carregando conversas...</p>
            ) : conversasAtivas.length === 0 ? (
              <p className={styles.vazio}>
                {aba === "coordenacao" ? "Nenhuma conversa com a coordenação até o momento." : "Nenhuma conversa com responsáveis até o momento."}
              </p>
            ) : (
              <ul className={styles.conversasList}>
                {conversasAtivas.map((c) => (
                  <li key={c.id}>
                    <Link href={`${basePath}/${c.id}`} className={styles.conversaCard}>
                      <div className={styles.conversaIcone}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 9h8" /><path d="M8 13h6" />
                          <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3z" />
                        </svg>
                      </div>
                      <div className={styles.conversaInfo}>
                        <div className={styles.conversaTopo}>
                          <p className={styles.conversaTitulo}>
                            {aba === "coordenacao" ? "Coordenação" : c.responsavel_nome}
                          </p>
                          <span className={styles.conversaData}>{formatarDataHora(c.ultima_atualizacao)}</span>
                        </div>
                        {aba === "responsaveis" && (
                          <span className={styles.alunoTag}>Aluno: {c.aluno_nome}</span>
                        )}
                        <p className={styles.conversaPrevia}>{c.ultima_mensagem || "Sem mensagens ainda"}</p>
                      </div>
                      {c.nao_lidas > 0 && <span className={styles.badge}>{c.nao_lidas}</span>}
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