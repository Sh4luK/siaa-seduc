// "use client"

// import logo from "../../assets/logo.png"
// import { useRouter } from "next/navigation"
// import { useEffect, useState } from "react"
// import Image from "next/image"
// import Link from "next/link"
// import styles from "./page.module.css"

// const API_BASE = "https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev";

// export default function Professor() {
//   const [authenticated, setAuthenticated] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [nomeCompleto, setNomeCompleto] = useState("")
//   const [id, setId] = useState("")
//   const [senha, setSenha] = useState("")
//   const [ip, setIp] = useState("")
//   const [menuOpen, setMenuOpen] = useState(false)
//   const [turmasAgrupadas, setTurmasAgrupadas] = useState([])
//   const [professor, setProfessor] = useState([])
//   const [disciplinas, setDisciplinas] = useState([])
//   const router = useRouter()

//   useEffect(() => {
//     async function verifyAuthentication() {
//       try {
//         const url = `${API_BASE}/api/teacher/auth`;
//         const response = await fetch(url);
//         const data = await response.json();

//         if (data.return === true) {
//           setAuthenticated(true);
//         } else {
//           setAuthenticated(false);
//           router.push("/professor/login");
//         }
//       } catch (error) {
//         setAuthenticated(false);
//         router.push("/professor/login");
//       } finally {
//         setLoading(false);
//       }
//     }

//     async function getData() {
//       try {
//         const urlAuth = `${API_BASE}/api/teacher/auth`;
//         const authResponse = await fetch(urlAuth);
//         if (!authResponse.ok) {
//           throw new Error();
//         }
//         const data = await authResponse.json();

//         const nome = data["teacher"]["nome_completo"] || "Não encontrado.";

//         setNomeCompleto(nome);
//         setSenha(data["teacher"]["senha"]);
//         setIp(data["teacher"]["ip"]);

//         return nome;
//       } catch (error) {
//         setNomeCompleto("Erro ao carregar.");
//         return null;
//       }
//     }

//     async function getTurmas(nomeCompleto) {
//       if (!nomeCompleto || nomeCompleto === "Não encontrado.") {
//         setTurmasAgrupadas([]);
//         return;
//       }

//       try {
//         const urlTurmas = `${API_BASE}/api/teacher/search/turmas?nome_completo=${encodeURIComponent(nomeCompleto)}`;
//         const urlDisciplinas = `${API_BASE}/api/teacher/search/disciplinas?nome_completo=${encodeURIComponent(nomeCompleto)}`;
//         const response1 = await fetch(urlTurmas);
//         const response2 = await fetch(urlDisciplinas);

//         if (!response1.ok && !response2.ok) {
//           throw new Error();
//         }
//         const data1 = await response1.json();
//         const data2 = await response2.json()
//         setProfessor(data1["professor"] || [])
//         setDisciplinas(data2["disciplinas"] || [])

//         // Agrupa os registros de AtravessaPor pelo nome da turma (grupo de
//         // alunos). Um mesmo grupo pode ter vários registros — um por
//         // disciplina lecionada pelo professor — então agrupamos aqui para
//         // exibir um único card por turma, com as disciplinas listadas dentro.
//         const turmasBrutas = data1["turmas"] || [];
//         const grupos = {};

//         for (const turma of turmasBrutas) {
//           const chave = turma.turma;
//           if (!grupos[chave]) {
//             grupos[chave] = {
//               nomeTurma: chave,
//               etapa: turma.etapa,
//               opcoes: [],
//             };
//           }
//           grupos[chave].opcoes.push(turma);
//         }

//         setTurmasAgrupadas(Object.values(grupos));
//       } catch (error) {
//         setTurmasAgrupadas([]);
//         setProfessor([])
//       }
//     }

//     async function init() {
//       await verifyAuthentication();
//       const nome = await getData();
//       await getTurmas(nome);
//     }

//     init();
//   }, []);

//   if (loading) {
//     return (
//       <div className={styles.page}>
//         <div className={styles.loadingWrap}>
//           <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
//           <div className={styles.loadingBar}>
//             <span className={styles.loadingBarFill} />
//           </div>
//           <p className={styles.loadingText}>Verificando credenciais…</p>
//         </div>
//       </div>
//     );
//   }
//   if (authenticated === true) {
//     const firstName = nomeCompleto.split(" ")[0];

//     return (
//       <div className={styles.page}>
//         <div className={styles.shell}>
//           <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
//             <div className={styles.sidebarHeader}>
//               <Image src={logo} alt="Logo do SIAA" className={styles.sidebarLogo} priority />
//               <span className={styles.sidebarBrand}>SIAA</span>
//             </div>

//             <nav className={styles.nav}>
//               <Link href="/professor" className={styles.navLinkActive}>
//                 <i className="ti ti-home" aria-hidden="true" />
//                 Início
//               </Link>
//               <Link href="/professor/turmas" className={styles.navLink}>
//                 <i className="ti ti-users" aria-hidden="true" />
//                 Minhas turmas
//               </Link>
//               <Link href="/professor/calendario" className={styles.navLink}>
//                 <i className="ti ti-users" aria-hidden="true" />
//                 Calendario Escolar
//               </Link>
//               <Link href="/professor/frequencia" className={styles.navLink}>
//                 <i className="ti ti-users" aria-hidden="true" />
//                 Frequencia
//               </Link>
//               <Link href="/professor/conteudos" className={styles.navLink}>
//                 <i className="ti ti-users" aria-hidden="true" />
//                 Conteudos
//               </Link>
//               <Link href="/professor/atividades" className={styles.navLink}>
//                 <i className="ti ti-users" aria-hidden="true" />
//                 Atividades
//               </Link>
//               <Link href="/professor/avaliacoes" className={styles.navLink}>
//                 <i className="ti ti-users" aria-hidden="true" />
//                 Avaliações
//               </Link>
//               <Link href="/professor/notas" className={styles.navLink}>
//                 <i className="ti ti-edit" aria-hidden="true" />
//                 Lançar notas
//               </Link>
//               <Link href="/professor/frequencia" className={styles.navLink}>
//                 <i className="ti ti-clipboard-check" aria-hidden="true" />
//                 Frequência
//               </Link>
//               <Link href="/professor/horarios" className={styles.navLink}>
//                 <i className="ti ti-clock" aria-hidden="true" />
//                 Horários
//               </Link>
//             </nav>

//             <div className={styles.sidebarFooter}>
//               <div>
//                 <span className={styles.infoCardHeader}>
//                   <span className={styles.infoCardSeal}>{firstName.charAt(0)}</span>
//                   <span className={styles.studentName}>{nomeCompleto}</span>
//                 </span>
//               </div>
//             </div>
//           </aside>

//           {menuOpen && (
//             <button
//               className={styles.overlay}
//               aria-label="Fechar menu"
//               onClick={() => setMenuOpen(false)}
//             />
//           )}

//           <div className={styles.content}>
//             <header className={styles.topbar}>
//               <button
//                 className={styles.menuButton}
//                 aria-label="Abrir menu"
//                 onClick={() => setMenuOpen(true)}
//               >
//                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//                   <line x1="4" y1="6" x2="20" y2="6" />
//                   <line x1="4" y1="12" x2="20" y2="12" />
//                   <line x1="4" y1="18" x2="20" y2="18" />
//                 </svg>
//               </button>
//               <span className={styles.topbarTitle}>Painel do professor</span>
//             </header>

//             <main className={styles.main}>
//               <h1 className={styles.greeting}>Olá, {firstName}</h1>
//               <p className={styles.subtitle}>
//                 Bem-vindo ao Sistema Integrado de Acompanhamento Acadêmico.
//               </p>

//               <section className={styles.grid}>
//                 <div className={styles.infoCard}>
//                   <div className={styles.infoCardHeader}>
//                     <span className={styles.infoCardSeal}>
//                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-info" viewBox="0 0 16 16">
//                         <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
//                       </svg>
//                     </span>
//                     <div>
//                       <p className={styles.infoCardTitle}>{nomeCompleto}</p>
//                     </div>
//                   </div>
//                   <div className={styles.infoCardBody}>
//                     {disciplinas.map((disciplina_) => (
//                       <span key={disciplina_["id"]}>{disciplina_["nome_disciplina"]}, </span>
//                     ))}
//                   </div>
//                 </div>
//               </section>
//               <br />
//               <section className={styles.grid}>
//                 {turmasAgrupadas.map((grupo) => {
//                   // Usa o primeiro registro do grupo como referência para o
//                   // link — qualquer um serve, já que o painel geral da turma
//                   // resolve a disciplina/etapa a partir do turmaId escolhido.
//                   const primeiroRegistro = grupo.opcoes[0];

//                   return (
//                     <Link
//                       key={grupo.nomeTurma}
//                       href={`/professor/turmas/${primeiroRegistro.id}`}
//                       className={styles.turmaCard}
//                     >
//                       <div className={styles.turmaHeader}>
//                         <span className={styles.turmaSeal} aria-hidden="true">
//                           {grupo.etapa?.charAt(0)}ª
//                         </span>
//                         <div>
//                           <p className={styles.turmaNome}>{grupo.nomeTurma}</p>
//                           <p className={styles.turmaTurno}>{grupo.etapa}</p>
//                         </div>
//                       </div>
//                       <div className={styles.turmaFooter}>
//                         <span className={styles.turmaAlunos}>
//                           {grupo.opcoes.length > 1
//                             ? `${grupo.opcoes.length} disciplinas`
//                             : "1 disciplina"}
//                         </span>
//                         <span className={styles.turmaArrow} aria-hidden="true">→</span>
//                       </div>
//                     </Link>
//                   );
//                 })}
//               </section>
//             </main>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return null;
// }



//codigo certo ========================================
"use client"

import logo from "../../assets/logo.png"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import layoutStyles from "./page.module.css"
import styles from "./home.module.css"

const API_BASE = "https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev";

export default function Professor() {
  const [authenticated, setAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nomeCompleto, setNomeCompleto] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [turmasAgrupadas, setTurmasAgrupadas] = useState([])
  const [disciplinas, setDisciplinas] = useState([])
  const router = useRouter()

  useEffect(() => {
    async function verifyAuthentication() {
      try {
        const url = `${API_BASE}/api/teacher/auth`;
        const response = await fetch(url);
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
        const urlAuth = `${API_BASE}/api/teacher/auth`;
        const authResponse = await fetch(urlAuth);
        if (!authResponse.ok) {
          throw new Error();
        }
        const data = await authResponse.json();
        const nome = data["teacher"]["nome_completo"] || "Não encontrado.";
        setNomeCompleto(nome);
        return nome;
      } catch (error) {
        setNomeCompleto("Erro ao carregar.");
        return null;
      }
    }

    async function getTurmas(nomeCompleto) {
      if (!nomeCompleto || nomeCompleto === "Não encontrado.") {
        setTurmasAgrupadas([]);
        return;
      }

      try {
        const urlTurmas = `${API_BASE}/api/teacher/search/turmas?nome_completo=${encodeURIComponent(nomeCompleto)}`;
        const urlDisciplinas = `${API_BASE}/api/teacher/search/disciplinas?nome_completo=${encodeURIComponent(nomeCompleto)}`;
        const response1 = await fetch(urlTurmas);
        const response2 = await fetch(urlDisciplinas);

        if (!response1.ok && !response2.ok) {
          throw new Error();
        }
        const data1 = await response1.json();
        const data2 = await response2.json()
        setDisciplinas(data2["disciplinas"] || [])

        const turmasBrutas = data1["turmas"] || [];
        const grupos = {};

        for (const turma of turmasBrutas) {
          const chave = turma.turma;
          if (!grupos[chave]) {
            grupos[chave] = {
              nomeTurma: chave,
              etapa: turma.etapa,
              opcoes: [],
            };
          }
          grupos[chave].opcoes.push(turma);
        }

        setTurmasAgrupadas(Object.values(grupos));
      } catch (error) {
        setTurmasAgrupadas([]);
      }
    }

    async function init() {
      await verifyAuthentication();
      const nome = await getData();
      await getTurmas(nome);
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
    const iniciais = nomeCompleto
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    const totalDisciplinas = turmasAgrupadas.reduce((soma, g) => soma + g.opcoes.length, 0);

    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.shell}>
          <aside className={`${layoutStyles.sidebar} ${menuOpen ? layoutStyles.sidebarOpen : ""}`}>
            <div className={layoutStyles.sidebarHeader}>
              <Image src={logo} alt="Logo do SIAA" className={layoutStyles.sidebarLogo} priority />
              <span className={layoutStyles.sidebarBrand}>SIAA</span>
            </div>

            <nav className={layoutStyles.nav}>
              <Link href="/professor" className={layoutStyles.navLinkActive}>
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
              <span className={layoutStyles.topbarTitle}>Painel do professor</span>
            </header>

            <main className={layoutStyles.main}>
              <h1 className={layoutStyles.greeting}>Olá, {firstName}</h1>
              <p className={layoutStyles.subtitle}>
                Bem-vindo ao Sistema Integrado de Acompanhamento Acadêmico.
              </p>

              {/* Card de perfil do professor */}
              <div className={styles.perfilCard}>
                <div className={styles.perfilAvatar}>{iniciais}</div>
                <div className={styles.perfilInfo}>
                  <p className={styles.perfilNome}>{nomeCompleto}</p>
                  <p className={styles.perfilSubinfo}>
                    {turmasAgrupadas.length} turma(s) · {totalDisciplinas} disciplina(s)
                  </p>
                </div>
              </div>

              {/* Disciplinas lecionadas, como chips */}
              {disciplinas.length > 0 && (
                <div className={styles.disciplinasSection}>
                  <h2 className={styles.sectionTitulo}>Disciplinas que você leciona</h2>
                  <div className={styles.disciplinasChips}>
                    {disciplinas.map((d) => (
                      <span key={d.id} className={styles.chip}>
                        {d.nome_disciplina}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid de turmas */}
              <div className={styles.turmasSection}>
                <div className={styles.turmasSectionHeader}>
                  <h2 className={styles.sectionTitulo}>Suas turmas</h2>
                  <Link href="/professor/turmas" className={styles.verTodasLink}>
                    Ver todas
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6l-6 6" />
                    </svg>
                  </Link>
                </div>

                {turmasAgrupadas.length === 0 ? (
                  <p className={styles.vazio}>Nenhuma turma encontrada.</p>
                ) : (
                  <div className={styles.turmasGrid}>
                    {turmasAgrupadas.map((grupo) => {
                      const primeiroRegistro = grupo.opcoes[0];
                      return (
                        <Link
                          key={grupo.nomeTurma}
                          href={`/professor/turmas/${primeiroRegistro.id}`}
                          className={styles.turmaCard}
                        >
                          <div className={styles.turmaCardTopo}>
                            <span className={styles.turmaSelo}>
                              {grupo.etapa?.charAt(0) || "?"}ª
                            </span>
                            <div className={styles.turmaCardInfo}>
                              <p className={styles.turmaCardNome} title={grupo.nomeTurma}>
                                {grupo.nomeTurma}
                              </p>
                              <p className={styles.turmaCardEtapa}>{grupo.etapa}</p>
                            </div>
                          </div>

                          <div className={styles.turmaCardRodape}>
                            <span className={styles.turmaCardDisciplinasQtd}>
                              {grupo.opcoes.length}{" "}
                              {grupo.opcoes.length === 1 ? "disciplina" : "disciplinas"}
                            </span>
                            <span className={styles.turmaCardArrow} aria-hidden="true">→</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return null;
}


// "use client"

// import logo from "../../assets/logo.png"
// import { useRouter } from "next/navigation"
// import { useEffect, useState } from "react"
// import Image from "next/image"
// import Link from "next/link"
// import layoutStyles from "./page.module.css"
// import styles from "./home.module.css"

// const API_BASE = "https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev";

// function IconCalendario() {
//   return (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
//       <path d="M16 3v4" />
//       <path d="M8 3v4" />
//       <path d="M4 11h16" />
//     </svg>
//   );
// }
// function IconRelogio() {
//   return (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
//       <path d="M12 7v5l3 3" />
//     </svg>
//   );
// }
// function IconCheck() {
//   return (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M9 11l3 3l8 -8" />
//       <path d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9" />
//     </svg>
//   );
// }
// function IconArquivo() {
//   return (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M14 3v4a1 1 0 0 0 1 1h4" />
//       <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
//       <path d="M9 9l1 0" />
//       <path d="M9 13l6 0" />
//       <path d="M9 17l6 0" />
//     </svg>
//   );
// }
// function IconClipboard() {
//   return (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
//       <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
//     </svg>
//   );
// }
// function IconAlerta() {
//   return (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M12 9v4" />
//       <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
//       <path d="M12 16h.01" />
//     </svg>
//   );
// }

// export default function Professor() {
//   const [authenticated, setAuthenticated] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [nomeCompleto, setNomeCompleto] = useState("")
//   const [menuOpen, setMenuOpen] = useState(false)
//   const [turmasAgrupadas, setTurmasAgrupadas] = useState([])
//   const [disciplinas, setDisciplinas] = useState([])
//   const [totalEventos, setTotalEventos] = useState(0)
//   const [escola, setEscola] = useState("")
//   const router = useRouter()

//   useEffect(() => {
//     async function verifyAuthentication() {
//       try {
//         const response = await fetch(`${API_BASE}/api/teacher/auth`);
//         const data = await response.json();

//         if (data.return === true) {
//           setAuthenticated(true);
//         } else {
//           setAuthenticated(false);
//           router.push("/professor/login");
//         }
//       } catch (error) {
//         setAuthenticated(false);
//         router.push("/professor/login");
//       } finally {
//         setLoading(false);
//       }
//     }

//     async function getData() {
//       try {
//         const authResponse = await fetch(`${API_BASE}/api/teacher/auth`);
//         if (!authResponse.ok) throw new Error();
//         const data = await authResponse.json();
//         const nome = data["teacher"]["nome_completo"] || "Não encontrado.";
//         setNomeCompleto(nome);
//         return { nome, id: data["teacher"]["id"] };
//       } catch (error) {
//         setNomeCompleto("Erro ao carregar.");
//         return { nome: null, id: null };
//       }
//     }

//     async function getTurmas(nomeCompleto) {
//       if (!nomeCompleto || nomeCompleto === "Não encontrado.") {
//         setTurmasAgrupadas([]);
//         return;
//       }

//       try {
//         const response1 = await fetch(
//           `${API_BASE}/api/teacher/search/turmas?nome_completo=${encodeURIComponent(nomeCompleto)}`
//         );
//         const response2 = await fetch(
//           `${API_BASE}/api/teacher/search/disciplinas?nome_completo=${encodeURIComponent(nomeCompleto)}`
//         );

//         if (!response1.ok && !response2.ok) throw new Error();
//         const data1 = await response1.json();
//         const data2 = await response2.json();
//         setDisciplinas(data2["disciplinas"] || []);

//         const turmasBrutas = data1["turmas"] || [];
//         const grupos = {};

//         for (const turma of turmasBrutas) {
//           const chave = turma.turma;
//           if (!grupos[chave]) {
//             grupos[chave] = { nomeTurma: chave, etapa: turma.etapa, escola: turma.escola, opcoes: [] };
//           }
//           grupos[chave].opcoes.push(turma);
//         }

//         const gruposArray = Object.values(grupos);
//         setTurmasAgrupadas(gruposArray);
//         if (gruposArray.length > 0) {
//           setEscola(gruposArray[0].escola || "");
//         }
//       } catch (error) {
//         setTurmasAgrupadas([]);
//       }
//     }

//     async function getEventos(professorId) {
//       if (!professorId) return;
//       try {
//         const hoje = new Date();
//         const res = await fetch(
//           `${API_BASE}/api/teacher/calendario/eventos?professor=${professorId}&ano=${hoje.getFullYear()}`
//         );
//         if (!res.ok) return;
//         const data = await res.json();
//         setTotalEventos(data.total_eventos || 0);
//       } catch (error) {
//         setTotalEventos(0);
//       }
//     }

//     async function init() {
//       await verifyAuthentication();
//       const { nome, id } = await getData();
//       await getTurmas(nome);
//       await getEventos(id);
//     }

//     init();
//   }, []);

//   if (loading) {
//     return (
//       <div className={layoutStyles.page}>
//         <div className={layoutStyles.loadingWrap}>
//           <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
//           <div className={layoutStyles.loadingBar}>
//             <span className={layoutStyles.loadingBarFill} />
//           </div>
//           <p className={layoutStyles.loadingText}>Verificando credenciais…</p>
//         </div>
//       </div>
//     );
//   }

//   if (authenticated === true) {
//     const firstName = nomeCompleto.split(" ")[0];
//     const totalDisciplinas = turmasAgrupadas.reduce((soma, g) => soma + g.opcoes.length, 0);
//     const primeiraDisciplina = disciplinas[0]?.nome_disciplina || "—";

//     const cards = [
//       { titulo: "Calendário", valor: totalEventos, legenda: "eventos cadastrados", icone: <IconCalendario />, cor: "verde", href: "/professor/calendario" },
//       { titulo: "Horários", valor: 0, legenda: "aulas na semana", icone: <IconRelogio />, cor: "azul", href: "/professor/horarios" },
//       { titulo: "Frequência", valor: 0, legenda: "registros", icone: <IconCheck />, cor: "verde", href: "/professor/frequencia" },
//       { titulo: "Atividades", valor: 0, legenda: "criadas", icone: <IconArquivo />, cor: "laranja", href: "/professor/atividades" },
//       { titulo: "Avaliações", valor: 0, legenda: "aplicadas", icone: <IconClipboard />, cor: "roxo", href: "/professor/avaliacoes" },
//       { titulo: "Advertências", valor: 0, legenda: "enviadas", icone: <IconAlerta />, cor: "vermelho", href: "#" },
//     ];

//     return (
//       <div className={layoutStyles.page}>
//         <div className={layoutStyles.shell}>
//           <aside className={`${layoutStyles.sidebar} ${menuOpen ? layoutStyles.sidebarOpen : ""}`}>
//             <div className={layoutStyles.sidebarHeader}>
//               <Image src={logo} alt="Logo do SIAA" className={layoutStyles.sidebarLogo} priority />
//               <span className={layoutStyles.sidebarBrand}>SIAA</span>
//             </div>

//             <nav className={layoutStyles.nav}>
//               <Link href="/professor" className={layoutStyles.navLinkActive}>
//                 <i className="ti ti-home" aria-hidden="true" />
//                 Início
//               </Link>
//               <Link href="/professor/turmas" className={layoutStyles.navLink}>
//                 <i className="ti ti-users" aria-hidden="true" />
//                 Minhas turmas
//               </Link>
//               <Link href="/professor/calendario" className={layoutStyles.navLink}>
//                 <i className="ti ti-users" aria-hidden="true" />
//                 Calendario Escolar
//               </Link>
//               <Link href="/professor/frequencia" className={layoutStyles.navLink}>
//                 <i className="ti ti-users" aria-hidden="true" />
//                 Frequencia
//               </Link>
//               <Link href="/professor/conteudos" className={layoutStyles.navLink}>
//                 <i className="ti ti-users" aria-hidden="true" />
//                 Conteudos
//               </Link>
//               <Link href="/professor/atividades" className={layoutStyles.navLink}>
//                 <i className="ti ti-users" aria-hidden="true" />
//                 Atividades
//               </Link>
//               <Link href="/professor/avaliacoes" className={layoutStyles.navLink}>
//                 <i className="ti ti-users" aria-hidden="true" />
//                 Avaliações
//               </Link>
//               <Link href="/professor/notas" className={layoutStyles.navLink}>
//                 <i className="ti ti-edit" aria-hidden="true" />
//                 Lançar notas
//               </Link>
//               <Link href="/professor/frequencia" className={layoutStyles.navLink}>
//                 <i className="ti ti-clipboard-check" aria-hidden="true" />
//                 Frequência
//               </Link>
//               <Link href="/professor/horarios" className={layoutStyles.navLink}>
//                 <i className="ti ti-clock" aria-hidden="true" />
//                 Horários
//               </Link>
//             </nav>

//             <div className={layoutStyles.sidebarFooter}>
//               <div>
//                 <span className={layoutStyles.infoCardHeader}>
//                   <span className={layoutStyles.infoCardSeal}>{firstName.charAt(0)}</span>
//                   <span className={layoutStyles.studentName}>{nomeCompleto}</span>
//                 </span>
//               </div>
//             </div>
//           </aside>

//           {menuOpen && (
//             <button
//               className={layoutStyles.overlay}
//               aria-label="Fechar menu"
//               onClick={() => setMenuOpen(false)}
//             />
//           )}

//           <div className={layoutStyles.content}>
//             <header className={layoutStyles.topbar}>
//               <button
//                 className={layoutStyles.menuButton}
//                 aria-label="Abrir menu"
//                 onClick={() => setMenuOpen(true)}
//               >
//                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//                   <line x1="4" y1="6" x2="20" y2="6" />
//                   <line x1="4" y1="12" x2="20" y2="12" />
//                   <line x1="4" y1="18" x2="20" y2="18" />
//                 </svg>
//               </button>
//               <span className={layoutStyles.topbarTitle}>Painel do professor</span>
//             </header>

//             <main className={layoutStyles.main}>
//               <h1 className={layoutStyles.greeting}>Olá, {firstName}</h1>
//               <p className={layoutStyles.subtitle}>
//                 Bem-vindo ao Sistema Integrado de Acompanhamento Acadêmico.
//               </p>

//               <div className={styles.statsGrid}>
//                 {cards.map((card) => (
//                   <Link key={card.titulo} href={card.href} className={styles.statCard}>
//                     <div className={styles.statCardHeader}>
//                       <span className={`${styles.statIcone} ${styles[`cor_${card.cor}`]}`}>
//                         {card.icone}
//                       </span>
//                       <span className={styles.statTitulo}>{card.titulo}</span>
//                     </div>
//                     <p className={`${styles.statValor} ${styles[`texto_${card.cor}`]}`}>
//                       {card.valor}
//                     </p>
//                     <p className={styles.statLegenda}>{card.legenda}</p>
//                   </Link>
//                 ))}
//               </div>

//               <div className={styles.infoCard}>
//                 <h2 className={styles.infoTitulo}>Informações</h2>
//                 <div className={styles.infoRow}>
//                   <span className={styles.infoItem}>
//                     Escola: <strong>{escola || "—"}</strong>
//                   </span>
//                   <span className={styles.infoItem}>
//                     Professor: <strong>{nomeCompleto || "—"}</strong>
//                   </span>
//                   <span className={styles.infoItem}>
//                     Disciplina: <strong>{primeiraDisciplina}</strong>
//                     {disciplinas.length > 1 && (
//                       <span className={styles.infoMais}> +{disciplinas.length - 1}</span>
//                     )}
//                   </span>
//                   <span className={styles.infoItem}>
//                     Turmas: <strong>{turmasAgrupadas.length}</strong>
//                   </span>
//                   <span className={styles.infoItem}>
//                     Disciplinas: <strong>{totalDisciplinas}</strong>
//                   </span>
//                 </div>
//               </div>
//             </main>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return null;
// }