// 'use client'

// import { useRouter } from "next/navigation"
// import { useEffect, useState } from "react"
// import logo from "../../assets/logo.png"
// import axios from "axios"
// import styles from "./page.module.css"
// import Image from "next/image"
// import Link from "next/link"
// export default function alunoPage() {
//     const [authenticated, setAuthenticated] = useState(null)
//     const [loading, setLoading] = useState(true)
//     const [nomeCompleto, setNomeCompleto] = useState("")
//     const [periodo, setPeriodo] = useState("")
//     const [escola, setEscola] = useState("")
//     const [serie, setSerie] = useState("")
//     const [turma, setTurma] = useState("")
//     const [primeiroNome, setPrimeiroNome] = ("")
//     const [menuOpen, setMenuOpen] = useState(false);
//     const router = useRouter()

//     useEffect(() => {
//         async function verifyAuthentication() {
//             try {
//                 const url = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.devapi/students/auth"
//                 const response = await fetch(url)
//                 const data = await response.json()
//                 console.log(data)
//                 if (data.return === true) {
//                     setAuthenticated(true)
//                 } else {
//                     setAuthenticated(false)
//                     router.push("/aluno/login")
//                 }
//             } catch (error) {
//                 setAuthenticated(false)
//                 router.push("/aluno/login")
//             } finally {
//                 setLoading(false)
//             }
//         }
//         async function getStudent() {
//             const url = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.devapi/students/auth"

//             fetch(url)
//                 .then((res) => {
//                     if (!res.ok) throw new Error()
//                     return res.json()
//                 }).then((data) => {
//                     setNomeCompleto(data["student"]["nome_completo"] || "Não encontrado.")
//                     setPeriodo(data["student"]["periodo"])
//                     setEscola(data["student"]["escola"])
//                     setSerie(data["student"]["serie"])
//                     setTurma(data["student"]["turma"])
//                 }).catch((error) => {
//                     setNomeCompleto("Erro ao carregar.")
//                 })
//         }
//         getStudent()
//         verifyAuthentication()
//     }, [router])

//     /*
//     if(loading){
//         return (
//             <div className="d-flex justify-content-center align-items-center vh-100">
//                 <div className="text-center">
//                     <img src={logo.src} alt="Logo" className="" style={{ width: "200px", height: "auto" }} />
//                 </div>
//                 <p>Verificando Credenciais...</p>
//             </div>
//         )
//     }
//     */
//     if (loading) {
//         return (
//             <div className={styles.page}>
//                 <div className={styles.loadingWrap}>
//                     <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
//                     <div className={styles.loadingBar}>
//                         <span className={styles.loadingBarFill} />
//                     </div>
//                     <p className={styles.loadingText}>Verificando credenciais…</p>
//                 </div>
//             </div>
//         );
//     }


//     /*
//     if(authenticated === true){
//         const firstName = nomeCompleto.split(" ")[0]
//         return (
//             <div className={styles.page}>
//                 <header className="p-3 mb-3 border-bottom">
//                     <div className="container">
//                         <div className="d-flex flex-wrap align-items-center justify-content-center justifi-content-lg-start">
//                             <a className="d-flex align-items-center mb-2 mb-lg-0 text-dark text-decoration-none">
//                                 <img src={logo.src} style={{ width: "100px", height: "auto" }} />
//                             </a>
//                             <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
//                                 <li className="px-1">
//                                     <a className="btn btn-dark btn-sm" href="/aluno">Inicio</a>
//                                 </li>
//                                 <li className="px-1">
//                                     <a className="btn btn-outline-dark btn-sm" href="/aluno/conteudos">Conteudos</a>
//                                 </li>
//                                 <li className="px-1">
//                                     <a className="btn btn-outline-dark btn-sm" href="/aluno/atividades">Atividades</a>
//                                 </li>
//                                 <li className="px-1">
//                                     <a className="btn btn-outline-dark btn-sm" href="/aluno/boletim">Boletim</a>
//                                 </li>
//                                 <li className="px-1">
//                                     <a className="btn btn-outline-dark btn-sm" href="/aluno/cronograma">Cronograma</a>
//                                 </li>
//                                 <li className="px-1">
//                                     <a className="btn btn-outline-dark btn-sm" href="/aluno/horarios">Horarios</a>
//                                 </li>
//                             </ul>
//                             <div className="text-end p-3 text-bg-success rounded shadow">
//                                 <small>{nomeCompleto}</small>
//                                 <br />
//                                 <small>{turma}</small>
//                             </div>
//                         </div>
//                     </div>
//                 </header>
                
                
//                 <br /><br />
//                 <main className="container">
//                     <h1 className="fs-4">Olá, {firstName}</h1>
//                     <small className="text-small">Bem-vindo ao Sistema Integrado de Acompanhamento Academico</small>

//                     <section className="container marketing">
//                         <div className="row">
//                             <div className="col-md-4">
                                
//                             </div>
//                         </div>
//                     </section>
//                 </main>
//             </div>
//         );
//     }

//     */
//     if (authenticated === true) {
//         const firstName = nomeCompleto.split(" ")[0];

//         return (
//             <div className={styles.page}>
//                 <div className={styles.shell}>
//                     <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
//                         <div className={styles.sidebarHeader}>
//                             <Image src={logo} alt="Logo do SIAA" className={styles.sidebarLogo} priority />
//                             <span className={styles.sidebarBrand}>SIAA</span>
//                         </div>

//                         <nav className={styles.nav}>
//                             <Link href="/aluno" className={styles.navLinkActive}>
//                                 <i className="ti ti-home" aria-hidden="true" />
//                                 Início
//                             </Link>
//                             <Link href="/aluno/conteudos" className={styles.navLink}>
//                                 <i className="ti ti-book" aria-hidden="true" />
//                                 Conteúdos
//                             </Link>
//                             <Link href="/aluno/atividades" className={styles.navLink}>
//                                 <i className="ti ti-clipboard-list" aria-hidden="true" />
//                                 Atividades
//                             </Link>
//                             <Link href="/aluno/boletim" className={styles.navLink}>
//                                 <i className="ti ti-report" aria-hidden="true" />
//                                 Boletim
//                             </Link>
//                             <Link href="/aluno/cronograma" className={styles.navLink}>
//                                 <i className="ti ti-calendar" aria-hidden="true" />
//                                 Cronograma
//                             </Link>
//                             <Link href="/aluno/horarios" className={styles.navLink}>
//                                 <i className="ti ti-clock" aria-hidden="true" />
//                                 Horários
//                             </Link>
//                         </nav>

//                         <div className={styles.sidebarFooter}>
//                             <span className={styles.studentName}>{nomeCompleto}</span>
//                             <span className={styles.studentClass}>{turma}</span>
//                         </div>
//                     </aside>

//                     {menuOpen && (
//                         <button
//                             className={styles.overlay}
//                             aria-label="Fechar menu"
//                             onClick={() => setMenuOpen(false)}
//                         />
//                     )}

//                     <div className={styles.content}>
//                         <header className={styles.topbar}>
//                             <button
//                                 className={styles.menuButton}
//                                 aria-label="Abrir menu"
//                                 onClick={() => setMenuOpen(true)}
//                             >
//                                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//                                     <line x1="4" y1="6" x2="20" y2="6" />
//                                     <line x1="4" y1="12" x2="20" y2="12" />
//                                     <line x1="4" y1="18" x2="20" y2="18" />
//                                 </svg>

//                             </button>
//                             <span className={styles.topbarTitle}>Painel do aluno</span>
//                         </header>

//                         <main className={styles.main}>
//                             <h1 className={styles.greeting}>Olá, {firstName}</h1>
//                             <p className={styles.subtitle}>
//                                 Bem-vindo ao Sistema Integrado de Acompanhamento Acadêmico.
//                             </p>

//                             <section className={styles.grid}>
//                                 {/* cards de conteúdo aqui */}
//                             </section>
//                         </main>
//                     </div>
//                 </div>
//             </div>
//         );
//     }
//     return null
// }



// "use client";

// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import logo from "../../assets/logo.png";
// import styles from "./page.module.css";
// import Image from "next/image";
// import Link from "next/link";

// const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

// export default function AlunoPage() {
//   const [authenticated, setAuthenticated] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [nomeCompleto, setNomeCompleto] = useState("");
//   const [periodo, setPeriodo] = useState("");
//   const [escola, setEscola] = useState("");
//   const [serie, setSerie] = useState("");
//   const [turma, setTurma] = useState("");
//   const [menuOpen, setMenuOpen] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     async function init() {
//       try {
//         const res = await fetch(`${API_BASE}/api/students/auth`);
//         const data = await res.json();

//         if (!data.return) {
//           setAuthenticated(false);
//           router.push("/aluno/login");
//           return;
//         }

//         setAuthenticated(true);
//         setNomeCompleto(data.student?.nome_completo || "Não encontrado.");
//         setPeriodo(data.student?.periodo || "");
//         setEscola(data.student?.escola || "");
//         setSerie(data.student?.serie || "");
//         setTurma(data.student?.turma || "");
//       } catch (error) {
//         setAuthenticated(false);
//         router.push("/aluno/login");
//       } finally {
//         setLoading(false);
//       }
//     }

//     init();
//   }, [router]);

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

//   if (authenticated !== true) return null;

//   const firstName = nomeCompleto.split(" ")[0];

//   return (
//     <div className={styles.page}>
//       <div className={styles.shell}>
//         <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
//           <div className={styles.sidebarHeader}>
//             <Image src={logo} alt="Logo do SIAA" className={styles.sidebarLogo} priority />
//             <span className={styles.sidebarBrand}>SIAA</span>
//           </div>

//           <nav className={styles.nav}>
//             <Link href="/aluno" className={styles.navLinkActive}>
//               <i className="ti ti-home" aria-hidden="true" />
//               Início
//             </Link>
//             <Link href="/aluno/conteudos" className={styles.navLink}>
//               <i className="ti ti-book" aria-hidden="true" />
//               Conteúdos
//             </Link>
//             <Link href="/aluno/atividades" className={styles.navLink}>
//               <i className="ti ti-clipboard-list" aria-hidden="true" />
//               Atividades
//             </Link>
//             <Link href="/aluno/boletim" className={styles.navLink}>
//               <i className="ti ti-report" aria-hidden="true" />
//               Boletim
//             </Link>
//             <Link href="/aluno/cronograma" className={styles.navLink}>
//               <i className="ti ti-calendar" aria-hidden="true" />
//               Cronograma
//             </Link>
//             <Link href="/aluno/horarios" className={styles.navLink}>
//               <i className="ti ti-clock" aria-hidden="true" />
//               Horários
//             </Link>
//           </nav>

//           <div className={styles.sidebarFooter}>
//             <span className={styles.studentName}>{nomeCompleto}</span>
//             <span className={styles.studentClass}>{turma}</span>
//           </div>
//         </aside>

//         {menuOpen && (
//           <button
//             className={styles.overlay}
//             aria-label="Fechar menu"
//             onClick={() => setMenuOpen(false)}
//           />
//         )}

//         <div className={styles.content}>
//           <header className={styles.topbar}>
//             <button
//               className={styles.menuButton}
//               aria-label="Abrir menu"
//               onClick={() => setMenuOpen(true)}
//             >
//               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//                 <line x1="4" y1="6" x2="20" y2="6" />
//                 <line x1="4" y1="12" x2="20" y2="12" />
//                 <line x1="4" y1="18" x2="20" y2="18" />
//               </svg>
//             </button>
//             <span className={styles.topbarTitle}>Painel do aluno</span>
//           </header>

//           <main className={styles.main}>
//             <h1 className={styles.greeting}>Olá, {firstName}</h1>
//             <p className={styles.subtitle}>
//               Bem-vindo ao Sistema Integrado de Acompanhamento Acadêmico.
//             </p>

//             <section className={styles.grid}>
//               {/* cards de conteúdo aqui */}
//             </section>
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }


// "use client";

// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import logo from "../../assets/logo.png";
// import styles from "./page.module.css";
// import Image from "next/image";
// import Link from "next/link";

// const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

// function formatarData(dataISO) {
//   if (!dataISO) return "";
//   const [ano, mes, dia] = dataISO.split("-");
//   const meses = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
//   return `${Number(dia)} de ${meses[Number(mes) - 1]}`;
// }

// export default function AlunoPage() {
//   const [authenticated, setAuthenticated] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [nomeCompleto, setNomeCompleto] = useState("");
//   const [escola, setEscola] = useState("");
//   const [serie, setSerie] = useState("");
//   const [turma, setTurma] = useState("");
//   const [menuOpen, setMenuOpen] = useState(false);

//   const [dashboard, setDashboard] = useState(null);
//   const [carregandoDashboard, setCarregandoDashboard] = useState(true);

//   const router = useRouter();

//   useEffect(() => {
//     async function init() {
//       try {
//         const res = await fetch(`${API_BASE}/api/students/auth`);
//         const data = await res.json();

//         if (!data.return) {
//           setAuthenticated(false);
//           router.push("/aluno/login");
//           return;
//         }

//         setAuthenticated(true);
//         setNomeCompleto(data.student?.nome_completo || "Não encontrado.");
//         setEscola(data.student?.escola || "");
//         setSerie(data.student?.serie || "");
//         setTurma(data.student?.turma || "");

//         const dashRes = await fetch(`${API_BASE}/api/students/dashboard`);
//         if (dashRes.ok) {
//           setDashboard(await dashRes.json());
//         }
//       } catch (error) {
//         setAuthenticated(false);
//         router.push("/aluno/login");
//       } finally {
//         setLoading(false);
//         setCarregandoDashboard(false);
//       }
//     }

//     init();
//   }, [router]);

//   if (loading) {
//     return (
//       <div className={styles.centerPage}>
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

//   if (authenticated !== true) return null;

//   const firstName = nomeCompleto.split(" ")[0];

//   return (
//     <div className={styles.page}>
//       <div className={styles.shell}>
//         <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
//           <div className={styles.sidebarHeader}>
//             <Image src={logo} alt="Logo do SIAA" className={styles.sidebarLogo} priority />
//             <span className={styles.sidebarBrand}>SIAA</span>
//           </div>

//           <nav className={styles.nav}>
//             <Link href="/aluno" className={styles.navLinkActive}>
//               <i className="ti ti-home" aria-hidden="true" />
//               Início
//             </Link>
//             <Link href="/aluno/conteudos" className={styles.navLink}>
//               <i className="ti ti-book" aria-hidden="true" />
//               Conteúdos
//             </Link>
//             <Link href="/aluno/atividades" className={styles.navLink}>
//               <i className="ti ti-clipboard-list" aria-hidden="true" />
//               Atividades
//             </Link>
//             <Link href="/aluno/boletim" className={styles.navLink}>
//               <i className="ti ti-report" aria-hidden="true" />
//               Boletim
//             </Link>
//             <Link href="/aluno/cronograma" className={styles.navLink}>
//               <i className="ti ti-calendar" aria-hidden="true" />
//               Cronograma
//             </Link>
//             <Link href="/aluno/horarios" className={styles.navLink}>
//               <i className="ti ti-clock" aria-hidden="true" />
//               Horários
//             </Link>
//           </nav>

//           <div className={styles.sidebarFooter}>
//             <span className={styles.studentName}>{nomeCompleto}</span>
//             <span className={styles.studentClass}>{turma}</span>
//           </div>
//         </aside>

//         {menuOpen && (
//           <button
//             className={styles.overlay}
//             aria-label="Fechar menu"
//             onClick={() => setMenuOpen(false)}
//           />
//         )}

//         <div className={styles.content}>
//           <header className={styles.topbar}>
//             <button
//               className={styles.menuButton}
//               aria-label="Abrir menu"
//               onClick={() => setMenuOpen(true)}
//             >
//               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//                 <line x1="4" y1="6" x2="20" y2="6" />
//                 <line x1="4" y1="12" x2="20" y2="12" />
//                 <line x1="4" y1="18" x2="20" y2="18" />
//               </svg>
//             </button>
//             <span className={styles.topbarTitle}>Painel do aluno</span>
//           </header>

//           <main className={styles.main}>
//             <h1 className={styles.greeting}>Olá, {firstName} 👋</h1>
//             <p className={styles.subtitle}>Aqui está o resumo do seu desempenho.</p>

//             {carregandoDashboard ? (
//               <p className={styles.subtitle}>Carregando dados...</p>
//             ) : (
//               <>
//                 <div className={styles.statsRow}>
//                   <div className={styles.statCard}>
//                     <span className={`${styles.statIcon} ${styles.statIconAmbar}`}>
//                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                         <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
//                         <rect x="9" y="3" width="6" height="4" rx="2" />
//                       </svg>
//                     </span>
//                     <span className={styles.statValor}>{dashboard?.total_pendentes ?? "—"}</span>
//                     <span className={styles.statLabel}>Pendentes</span>
//                   </div>

//                   <div className={styles.statCard}>
//                     <span className={`${styles.statIcon} ${styles.statIconVerde}`}>
//                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                         <polyline points="3 17 9 11 13 15 21 7" />
//                         <polyline points="14 7 21 7 21 14" />
//                       </svg>
//                     </span>
//                     <span className={styles.statValor}>{dashboard?.media_geral ?? "—"}</span>
//                     <span className={styles.statLabel}>Média Geral</span>
//                   </div>

//                   <div className={styles.statCard}>
//                     <span className={`${styles.statIcon} ${styles.statIconAzul}`}>
//                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                         <path d="M12 3a9 9 0 0 0 9 9a9 9 0 0 0 -9 9a9 9 0 0 0 -9 -9a9 9 0 0 0 9 -9" />
//                       </svg>
//                     </span>
//                     <span className={styles.statValor}>
//                       {dashboard?.frequencia_percentual != null ? `${dashboard.frequencia_percentual}%` : "—"}
//                     </span>
//                     <span className={styles.statLabel}>Frequência</span>
//                   </div>

//                   <div className={styles.statCard}>
//                     <span className={`${styles.statIcon} ${styles.statIconRoxo}`}>
//                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                         <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
//                         <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
//                         <path d="M3 6l0 13" />
//                         <path d="M12 6l0 13" />
//                         <path d="M21 6l0 13" />
//                       </svg>
//                     </span>
//                     <span className={styles.statValor}>{dashboard?.total_conteudos ?? "—"}</span>
//                     <span className={styles.statLabel}>Conteúdos</span>
//                   </div>
//                 </div>

//                 <div className={styles.duasColunas}>
//                   <div className={styles.painel}>
//                     <div className={styles.painelHeader}>
//                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                         <path d="M12 9v4" />
//                         <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
//                         <path d="M12 16h.01" />
//                       </svg>
//                       <span>Atenção Necessária</span>
//                     </div>

//                     {(!dashboard?.atencao_necessaria || dashboard.atencao_necessaria.length === 0) ? (
//                       <p className={styles.painelVazio}>Nenhum ponto de atenção no momento.</p>
//                     ) : (
//                       <ul className={styles.atencaoLista}>
//                         {dashboard.atencao_necessaria.map((item, i) => (
//                           <li key={i} className={styles.atencaoItem}>
//                             <span className={styles.atencaoDisciplina}>
//                               <span className={styles.bolinha} />
//                               {item.disciplina || "Disciplina"}
//                             </span>
//                             <span className={styles.atencaoValor}>
//                               {item.tipo === "media" ? `Média: ${item.valor}` : `Freq: ${item.valor}%`}
//                             </span>
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>

//                   <div className={styles.painel}>
//                     <div className={styles.painelHeader}>
//                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                         <circle cx="12" cy="12" r="9" />
//                         <polyline points="12 7 12 12 15 15" />
//                       </svg>
//                       <span>Próximas Entregas</span>
//                     </div>

//                     {(!dashboard?.proximas_entregas || dashboard.proximas_entregas.length === 0) ? (
//                       <p className={styles.painelVazio}>Nenhuma entrega pendente.</p>
//                     ) : (
//                       <ul className={styles.entregasLista}>
//                         {dashboard.proximas_entregas.map((item, i) => (
//                           <li key={i} className={styles.entregaItem}>
//                             <span className={styles.bolinha} />
//                             <div className={styles.entregaInfo}>
//                               <p className={styles.entregaTitulo}>{item.titulo}</p>
//                               <p className={styles.entregaData}>{formatarData(item.data_entrega)}</p>
//                             </div>
//                             <span
//                               className={
//                                 item.status === "atrasado" ? styles.badgeAtrasado : styles.badgePendente
//                               }
//                             >
//                               {item.status === "atrasado" ? "Em atraso" : "Pendente"}
//                             </span>
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>
//                 </div>

//                 <div className={styles.painel} style={{ marginTop: "1rem" }}>
//                   <div className={styles.painelHeader}>
//                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <rect x="4" y="5" width="16" height="16" rx="2" />
//                       <path d="M16 3v4" />
//                       <path d="M8 3v4" />
//                       <path d="M4 11h16" />
//                     </svg>
//                     <span>Meus Estudos Programados</span>
//                   </div>
//                   <p className={styles.painelVazio}>
//                     Nenhum estudo programado.{" "}
//                     <Link href="/aluno/cronograma" className={styles.linkInline}>Criar cronograma</Link>
//                   </p>
//                 </div>
//               </>
//             )}
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function formatarData(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  const meses = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  return `${Number(dia)} de ${meses[Number(mes) - 1]}`;
}

export default function AlunoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [turma, setTurma] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [estudosProgramados, setEstudosProgramados] = useState([]);
  const [carregandoDashboard, setCarregandoDashboard] = useState(true);
  const [erro, setErro] = useState(null);

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
        setLoading(false);

        const [dashRes, cronogramaRes] = await Promise.all([
          fetch(`${API_BASE}/api/students/dashboard`),
          fetch(`${API_BASE}/api/students/cronograma`),
        ]);

        if (!dashRes.ok) throw new Error(`Falha ao buscar dashboard (status ${dashRes.status})`);
        setDashboard(await dashRes.json());

        if (cronogramaRes.ok) {
          const cronoData = await cronogramaRes.json();
          setEstudosProgramados(cronoData.estudos || []);
        }
      } catch (error) {
        if (authenticated !== false) {
          setErro(`Erro ao carregar dados: ${error.message}`);
        } else {
          router.push("/aluno/login");
        }
      } finally {
        setCarregandoDashboard(false);
      }
    }

    init();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.centerPage}>
        <div className={styles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
          <div className={styles.loadingBar}>
            <span className={styles.loadingBarFill} />
          </div>
          <p className={styles.loadingText}>Verificando credenciais…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  const firstName = nomeCompleto.split(" ")[0];

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.sidebarHeader}>
            <Image src={logo} alt="Logo do SIAA" className={styles.sidebarLogo} priority />
            <span className={styles.sidebarBrand}>SIAA</span>
          </div>

          <nav className={styles.nav}>
            <Link href="/aluno" className={styles.navLinkActive}>
              <i className="ti ti-home" aria-hidden="true" />
              Início
            </Link>
            <Link href="/aluno/conteudos" className={styles.navLink}>
              <i className="ti ti-book" aria-hidden="true" />
              Conteúdos
            </Link>
            <Link href="/aluno/atividades" className={styles.navLink}>
              <i className="ti ti-clipboard-list" aria-hidden="true" />
              Atividades
            </Link>
            <Link href="/aluno/boletim" className={styles.navLink}>
              <i className="ti ti-report" aria-hidden="true" />
              Boletim
            </Link>
            <Link href="/aluno/cronograma" className={styles.navLink}>
              <i className="ti ti-calendar" aria-hidden="true" />
              Cronograma
            </Link>
            <Link href="/aluno/horarios" className={styles.navLink}>
              <i className="ti ti-clock" aria-hidden="true" />
              Horários
            </Link>
          </nav>

          <div className={styles.sidebarFooter}>
            <span className={styles.studentName}>{nomeCompleto}</span>
            <span className={styles.studentClass}>{turma}</span>
          </div>
        </aside>

        {menuOpen && (
          <button className={styles.overlay} aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />
        )}

        <div className={styles.content}>
          <header className={styles.topbar}>
            <button className={styles.menuButton} aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            <span className={styles.topbarTitle}>Painel do aluno</span>
          </header>

          <main className={styles.main}>
            <h1 className={styles.greeting}>Olá, {firstName}</h1>
            <p className={styles.subtitle}>Aqui está o resumo do seu desempenho.</p>

            {erro && <p className={styles.painelVazio} style={{ color: "#b91c1c" }}>{erro}</p>}

            {carregandoDashboard ? (
              <p className={styles.subtitle}>Carregando dados...</p>
            ) : (
              <>
                <div className={styles.statsRow}>
                  <div className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.statIconAmbar}`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
                        <rect x="9" y="3" width="6" height="4" rx="2" />
                      </svg>
                    </span>
                    <span className={styles.statValor}>{dashboard?.total_pendencias ?? "—"}</span>
                    <span className={styles.statLabel}>Pendentes</span>
                  </div>

                  <div className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.statIconVerde}`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 17 9 11 13 15 21 7" />
                        <polyline points="14 7 21 7 21 14" />
                      </svg>
                    </span>
                    <span className={styles.statValor}>{dashboard?.media_geral ?? "—"}</span>
                    <span className={styles.statLabel}>Média Geral</span>
                  </div>

                  <div className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.statIconAzul}`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a9 9 0 0 0 9 9a9 9 0 0 0 -9 9a9 9 0 0 0 -9 -9a9 9 0 0 0 9 -9" />
                      </svg>
                    </span>
                    <span className={styles.statValor}>
                      {dashboard?.frequencia_percentual != null ? `${dashboard.frequencia_percentual}%` : "—"}
                    </span>
                    <span className={styles.statLabel}>Frequência</span>
                    {dashboard?.frequencia_baixa_pe_de_meia && (
                      <span className={styles.avisoPeDeMeia}>Abaixo do mínimo do Pé de Meia</span>
                    )}
                  </div>

                  <div className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.statIconRoxo}`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
                        <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
                        <path d="M3 6l0 13" />
                        <path d="M12 6l0 13" />
                        <path d="M21 6l0 13" />
                      </svg>
                    </span>
                    <span className={styles.statValor}>{dashboard?.total_conteudos ?? "—"}</span>
                    <span className={styles.statLabel}>Conteúdos</span>
                  </div>
                </div>

                <div className={styles.duasColunas}>
                  <div className={styles.painel}>
                    <div className={styles.painelHeader}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 9v4" />
                        <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
                        <path d="M12 16h.01" />
                      </svg>
                      <span>Atenção Necessária</span>
                    </div>

                    {(!dashboard?.atencao_necessaria || dashboard.atencao_necessaria.length === 0) ? (
                      <p className={styles.painelVazio}>Nenhuma disciplina com média abaixo de 6.</p>
                    ) : (
                      <ul className={styles.atencaoLista}>
                        {dashboard.atencao_necessaria.map((item, i) => (
                          <li key={i} className={styles.atencaoItem}>
                            <span className={styles.atencaoDisciplina}>
                              <span className={styles.bolinha} />
                              {item.disciplina || "Disciplina"}
                            </span>
                            <span className={styles.atencaoValor}>Média: {item.media}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className={styles.painel}>
                    <div className={styles.painelHeader}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <polyline points="12 7 12 12 15 15" />
                      </svg>
                      <span>Próximas Entregas</span>
                    </div>

                    {(!dashboard?.proximas_entregas || dashboard.proximas_entregas.length === 0) ? (
                      <p className={styles.painelVazio}>Nenhuma atividade pendente.</p>
                    ) : (
                      <ul className={styles.entregasLista}>
                        {dashboard.proximas_entregas.map((item, i) => (
                          <li key={i} className={styles.entregaItem}>
                            <span className={styles.bolinha} />
                            <div className={styles.entregaInfo}>
                              <p className={styles.entregaTitulo}>{item.titulo}</p>
                              <p className={styles.entregaData}>
                                {item.disciplina ? `${item.disciplina} · ` : ""}
                                {formatarData(item.data_entrega)}
                              </p>
                            </div>
                            <span className={styles.badgePendente}>Pendente</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className={styles.painel} style={{ marginTop: "1rem" }}>
                  <div className={styles.painelHeader}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="5" width="16" height="16" rx="2" />
                      <path d="M16 3v4" />
                      <path d="M8 3v4" />
                      <path d="M4 11h16" />
                    </svg>
                    <span>Meus Estudos Programados</span>
                  </div>

                  {estudosProgramados.length === 0 ? (
                    <p className={styles.painelVazio}>
                      Nenhum estudo programado.{" "}
                      <Link href="/aluno/cronograma" className={styles.linkInline}>Criar cronograma</Link>
                    </p>
                  ) : (
                    <>
                      <ul className={styles.estudosLista}>
                        {estudosProgramados.slice(0, 5).map((e) => (
                          <li
                            key={e.id}
                            className={`${styles.estudoItem} ${e.concluido ? styles.estudoConcluido : ""}`}
                          >
                            <span className={styles.bolinha} />
                            <div className={styles.entregaInfo}>
                              <p className={styles.entregaTitulo}>{e.titulo}</p>
                              <p className={styles.entregaData}>
                                {e.disciplina ? `${e.disciplina} · ` : ""}
                                {formatarData(e.data)}
                              </p>
                            </div>
                            {e.concluido && <span className={styles.badgeConcluido}>Concluído</span>}
                          </li>
                        ))}
                      </ul>
                      <Link href="/aluno/cronograma" className={styles.linkInline} style={{ marginTop: "0.75rem", display: "inline-block" }}>
                        Criar cronograma
                      </Link>
                    </>
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