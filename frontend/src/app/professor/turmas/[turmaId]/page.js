// "use client";

// import logo from "../../../../assets/logo.png"
// import Image from "next/image"
// import Link from "next/link";
// import { useParams } from "next/navigation";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import styles from "../../page.module.css"

// export default function TurmaPage() {
//   const [authenticated, setAuthenticated] = useState(null)
//   const { turmaId } = useParams();
//   const [turma, setTurma] = useState(null);
//   const [turmaLength, setTurmaLength] = useState(0)
//   const [turmaName, setTurmaName] = useState("")
//   const [professorId, setProfessorId] = useState("")
//   const [loading, setLoading] = useState(true);
//   const [nomeCompleto, setNomeCompleto] = useState("")
//   const [id, setId] = useState("")
//   const [senha, setSenha] = useState("")
//   const [ip, setIp] = useState("")
//   const [menuOpen, setMenuOpen] = useState(false)
//   const [turmas, setTurmas] = useState([])
//   const [pofessor, setProfessor] = useState([])
//   const [disciplinas, setDisciplinas] = useState([])
//   const router = useRouter()

//   useEffect(() => {
//     async function verifyAuthentication() {
//       try {
//         const url = "https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev/api/teacher/auth";
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
//         const urlAuth = "https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev/api/teacher/auth";
//         const authResponse = await fetch(urlAuth);
//         if (!authResponse.ok) {
//           throw new Error();
//         }
//         const data = await authResponse.json();

//         const nome = data["teacher"]["nome_completo"] || "Não encontrado.";

//         setNomeCompleto(nome);
//         setSenha(data["teacher"]["senha"]);
//         setIp(data["teacher"]["ip"]);
//         setProfessorId(data["teacher"]["id"])
//         return nome
//       } catch (error) {
//         setNomeCompleto("Erro ao carregar.");
//         return null;
//       }
//     }

//     async function getTurmas(nomeCompleto) {
//       if (!nomeCompleto || nomeCompleto === "Não encontrado.") {
//         setTurmas([]);
//         return;
//       }

//       try {
//         const urlTurmas = `https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev/api/teacher/search/turmas?nome_completo=${encodeURIComponent(nomeCompleto)}`;
//         const urlDisciplinas = `https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev/api/teacher/search/disciplinas?nome_completo=${encodeURIComponent(nomeCompleto)}`;
//         const response1 = await fetch(urlTurmas);
//         const response2 = await fetch(urlDisciplinas);

//         if (!response1.ok && !response2.ok) {
//           throw new Error();
//         }
//         const data1 = await response1.json();
//         const data2 = await response2.json()
//         setProfessor(data1["professor"] || [])
//         setTurmas(data1["turmas"] || []);
//         setDisciplinas(data2["disciplinas"] || [])
//       } catch (error) {
//         setTurmas([]);
//         setProfessor([])
//       }
//     }
//     async function getTurma() {
//       try {
//         const url = `https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev/api/teacher/search/turma?turma=${turmaId}`
//         const response = await fetch(url)

//         if (!response.ok) {
//           throw new Error()
//         }

//         const data = await response.json()

//         console.log({ getTurma: data["turma"] })
//         setTurma(data["turma"])
//       } catch (error) {
//         setTurma([])
//       }

//     }

//     async function getTurmaLength() {
//       try {
//         const getTurma = await fetch(`https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev/api/teacher/search/turma?turma=${turmaId}`)
//         const getData = await getTurma.json()
//         console.log("1) getData da turma:", getData)

//         const turmaObj = Array.isArray(getData["turma"]) ? getData["turma"][0] : getData["turma"]
//         console.log("2) turmaObj extraído:", turmaObj)

//         if (!turmaObj || !turmaObj["turma"]) {
//           console.log("3) turmaObj ou turmaObj.turma está vazio/undefined")
//           setTurmaLength(0)
//           return
//         }
//         //https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev/api/teacher/get/alunos?turma=EMTPDES-SIS-2%C2%AA%20SERIE-INTEGRAL-I-A
//         const turmaName = encodeURIComponent(turmaObj["turma"])
//         const urlAlunos = `https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev/api/teacher/get/alunos?turma=${turmaName}`
//         console.log("4) URL chamada:", urlAlunos)

//         const response = await fetch(urlAlunos)
//         console.log("5) status da resposta:", response.status)

//         const data = await response.json()
//         console.log("6) data retornada:", data)

//         setTurmaLength(data["total"] || 0)
//       } catch (error) {
//         console.log("ERRO:", error)
//         setTurmaLength(0)
//       }
//     }
//     async function init() {
//       await verifyAuthentication();
//       const nome = await getData();
//       await getTurmas(nome);
//       await getTurma()
//       await getTurmaLength()
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
//     /*
//     const turmas = [
//       { id: 1, nome: "9º Ano A", turno: "Matutino", alunos: 32 },
//       { id: 2, nome: "9º Ano B", turno: "Matutino", alunos: 29 },
//       { id: 3, nome: "1º Ano EM", turno: "Vespertino", alunos: 35 },
//     ];
//     */

//     const firstName = nomeCompleto.split(" ")[0];
//     console.log(turma)
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
//               {/*<span className={styles.studentClass}>{disciplina}</span>*/}
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
//                 {/* V/ocê está no acesso da turma de identificação(ID) {turmaId} de acordo com nossa base de dados. */}
//                 {nomeCompleto} está administrando a turma
//               </p>

//               <section className={styles.grid}>
//                 <Link href={`/professor/turmas/${turmaId}/alunos`} className={styles.infoCard}>
//                   <div className={styles.infoCardHeader}>
//                     <span className={styles.infoCardSeal}>
//                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-lines-fill" viewBox="0 0 16 16">
//                         <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1z" />
//                       </svg>
//                     </span>
//                     <div>
//                       <p className={styles.infoCardTitle}>Lista de Alunos</p>
//                     </div>
//                   </div>
//                   <div className={styles.infoCardFooter}>
//                     <span className={styles.turmaAlunos}>{turmaLength} alunos</span>
//                     <span className={styles.infoCardArrow} aria-hidden="true">→</span>
//                   </div>
//                 </Link>
//                 <Link href={`/professor/frequencia/turma/${turmaId}`} className={styles.infoCard}>
//                   <div className={styles.infoCardHeader}>
//                     <span className={styles.infoCardSeal}>
//                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-card-checklist" viewBox="0 0 16 16">
//                         <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2z" />
//                         <path d="M7 5.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 1 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0M7 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 0 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0" />
//                       </svg>
//                     </span>
//                     <div>
//                       <p className={styles.infoCardTitle}>Realizar Frequencia</p>
//                     </div>
//                   </div>
//                   <div className={styles.infoCardFooter}>
//                     {/* <span className={styles.turmaAlunos}></span> */}
//                     <span className={styles.infoCardArrow} aria-hidden="true">→</span>
//                   </div>
//                 </Link>
//                 <Link href={`/professor/turmas/${turmaId}/notificacoes`} className={styles.infoCard}>
//                   <div className={styles.infoCardHeader}>
//                     <span className={styles.infoCardSeal}>
//                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bell" viewBox="0 0 16 16">
//                         <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6" />
//                       </svg>
//                     </span>
//                     <div>
//                       <p className={styles.infoCardTitle}>Notificações</p>
//                     </div>
//                   </div>
//                   <div className={styles.infoCardFooter}>
//                     {/* <span className={styles.turmaAlunos}></span> */}
//                     <span className={styles.infoCardArrow} aria-hidden="true">→</span>
//                   </div>
//                 </Link>
//               </section>
//             </main>
//           </div>
//         </div>
//       </div>
//     );
//   }
//   return null
// }


// codigo estilizado ===============================
// "use client";

// import logo from "../../../../assets/logo.png"
// import Image from "next/image"
// import Link from "next/link";
// import { useParams } from "next/navigation";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import layoutStyles from "../../page.module.css"
// import styles from "./turma.module.css"

// const API_BASE = "https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev";

// export default function TurmaPage() {
//   const [authenticated, setAuthenticated] = useState(null)
//   const { turmaId } = useParams();
//   const [turma, setTurma] = useState(null);
//   const [turmaLength, setTurmaLength] = useState(0)
//   const [professorId, setProfessorId] = useState("")
//   const [loading, setLoading] = useState(true);
//   const [nomeCompleto, setNomeCompleto] = useState("")
//   const [menuOpen, setMenuOpen] = useState(false)
//   const [alunos, setAlunos] = useState([])
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
//         setProfessorId(data["teacher"]["id"])
//         return nome
//       } catch (error) {
//         setNomeCompleto("Erro ao carregar.");
//         return null;
//       }
//     }

//     async function getTurma() {
//       try {
//         const response = await fetch(`${API_BASE}/api/teacher/search/turma?turma=${turmaId}`)
//         if (!response.ok) throw new Error()
//         const data = await response.json()
//         setTurma(data["turma"])
//       } catch (error) {
//         setTurma(null)
//       }
//     }

//     async function getAlunosDaTurma() {
//       try {
//         const turmaRes = await fetch(`${API_BASE}/api/teacher/search/turma?turma=${turmaId}`)
//         if (!turmaRes.ok) throw new Error(`Falha ao buscar turma (status ${turmaRes.status})`)
//         const turmaData = await turmaRes.json()
//         const nomeTurma = turmaData.turma?.turma
//         if (!nomeTurma) throw new Error("Nome da turma não encontrado.")

//         const alunosRes = await fetch(
//           `${API_BASE}/api/teacher/get/alunos?turma=${encodeURIComponent(nomeTurma)}`
//         )
//         if (!alunosRes.ok) throw new Error(`Falha ao buscar alunos (status ${alunosRes.status})`)
//         const alunosData = await alunosRes.json()

//         setAlunos(alunosData.alunos || [])
//         setTurmaLength(alunosData.total || 0)
//       } catch (error) {
//         setAlunos([])
//         setTurmaLength(0)
//       }
//     }

//     async function init() {
//       await verifyAuthentication();
//       await getData();
//       await getTurma()
//       await getAlunosDaTurma()
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
//     const nomeTurma = turma?.turma || "Turma";
//     const etapa = turma?.etapa || "";
//     const disciplina = turma?.disciplina_lecionada || "";
//     const escola = turma?.escola || "";

//     return (
//       <div className={layoutStyles.page}>
//         <div className={layoutStyles.shell}>
//           <aside className={`${layoutStyles.sidebar} ${menuOpen ? layoutStyles.sidebarOpen : ""}`}>
//             <div className={layoutStyles.sidebarHeader}>
//               <Image src={logo} alt="Logo do SIAA" className={layoutStyles.sidebarLogo} priority />
//               <span className={layoutStyles.sidebarBrand}>SIAA</span>
//             </div>

//             <nav className={layoutStyles.nav}>
//               <Link href="/professor" className={layoutStyles.navLink}>
//                 <i className="ti ti-home" aria-hidden="true" />
//                 Início
//               </Link>
//               <Link href="/professor/turmas" className={layoutStyles.navLinkActive}>
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
//             <button className={layoutStyles.overlay} aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />
//           )}

//           <div className={layoutStyles.content}>
//             <header className={layoutStyles.topbar}>
//               <button className={layoutStyles.menuButton} aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
//                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//                   <line x1="4" y1="6" x2="20" y2="6" />
//                   <line x1="4" y1="12" x2="20" y2="12" />
//                   <line x1="4" y1="18" x2="20" y2="18" />
//                 </svg>
//               </button>
//               <span className={layoutStyles.topbarTitle}>Painel da turma</span>
//             </header>

//             <main className={layoutStyles.main}>
//               <Link href="/professor/turmas" className={styles.voltarLink}>
//                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M15 6l-6 6l6 6" />
//                 </svg>
//                 Minhas turmas
//               </Link>

//               <div className={styles.turmaHero}>
//                 <div className={styles.turmaHeroSelo}>
//                   {etapa?.charAt(0) || "?"}ª
//                 </div>
//                 <div className={styles.turmaHeroInfo}>
//                   <h1 className={styles.turmaHeroNome}>{nomeTurma}</h1>
//                   <p className={styles.turmaHeroDetalhe}>
//                     {etapa}{escola && ` · ${escola}`}
//                   </p>
//                   {disciplina && (
//                     <span className={styles.turmaHeroChip}>{disciplina}</span>
//                   )}
//                 </div>
//               </div>

//               <section className={styles.acoesGrid}>
//                 <Link href={`/professor/turmas/${turmaId}/alunos`} className={styles.acaoCard}>
//                   <span className={`${styles.acaoIcone} ${styles.corAzul}`}>
//                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
//                       <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
//                       <path d="M16 3.13a4 4 0 0 1 0 7.75" />
//                       <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
//                     </svg>
//                   </span>
//                   <p className={styles.acaoTitulo}>Lista de alunos</p>
//                   <p className={styles.acaoValor}>{turmaLength}</p>
//                   <p className={styles.acaoLegenda}>aluno(s) matriculado(s)</p>
//                 </Link>

//                 <Link href={`/professor/notas/turma/${turmaId}`} className={styles.acaoCard}>
//                   <span className={`${styles.acaoIcone} ${styles.corRoxo}`}>
//                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
//                       <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
//                     </svg>
//                   </span>
//                   <p className={styles.acaoTitulo}>Lançar notas</p>
//                   <p className={styles.acaoLegenda}>Registrar notas trimestrais</p>
//                 </Link>

//                 <Link href={`/professor/frequencia/turma/${turmaId}`} className={styles.acaoCard}>
//                   <span className={`${styles.acaoIcone} ${styles.corVerde}`}>
//                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
//                       <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
//                       <path d="M9 14l2 2l4 -4" />
//                     </svg>
//                   </span>
//                   <p className={styles.acaoTitulo}>Frequência</p>
//                   <p className={styles.acaoLegenda}>Registrar presença e falta</p>
//                 </Link>

//                 <div className={`${styles.acaoCard} ${styles.acaoDesabilitada}`}>
//                   <span className={`${styles.acaoIcone} ${styles.corLaranja}`}>
//                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6" />
//                     </svg>
//                   </span>
//                   <p className={styles.acaoTitulo}>Notificações</p>
//                   <p className={styles.acaoLegenda}>Em breve</p>
//                 </div>
//               </section>

//               <section className={styles.alunosSection}>
//                 <h2 className={styles.alunosSectionTitle}>
//                   Alunos da turma
//                   <span className={styles.alunosCount}>{alunos.length}</span>
//                 </h2>

//                 {alunos.length === 0 ? (
//                   <p className={styles.alunosEmpty}>Nenhum aluno encontrado para esta turma.</p>
//                 ) : (
//                   <ul className={styles.alunosList}>
//                     {alunos.map((aluno) => {
//                       const iniciais = aluno.nome_completo
//                         .split(" ")
//                         .slice(0, 2)
//                         .map((n) => n[0])
//                         .join("")
//                         .toUpperCase();

//                       return (
//                         <li key={aluno.id}>
//                           <Link
//                             href={`/professor/turmas/${turmaId}/alunos/${aluno.id}`}
//                             className={styles.alunoItem}
//                           >
//                             <span className={styles.alunoAvatar}>{iniciais}</span>
//                             <span className={styles.alunoInfo}>
//                               <span className={styles.alunoNome}>{aluno.nome_completo}</span>
//                               {aluno.posicao_ordem && (
//                                 <span className={styles.alunoPosicao}>Nº {aluno.posicao_ordem}</span>
//                               )}
//                             </span>
//                             <span className={styles.alunoArrow} aria-hidden="true">→</span>
//                           </Link>
//                         </li>
//                       );
//                     })}
//                   </ul>
//                 )}
//               </section>
//             </main>
//           </div>
//         </div>
//       </div>
//     );
//   }
//   return null
// }



"use client";

import logo from "../../../../assets/logo.png"
import Image from "next/image"
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import layoutStyles from "../../page.module.css"
import styles from "./turma.module.css"

const API_BASE = "https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev";

export default function TurmaPage() {
  const [authenticated, setAuthenticated] = useState(null)
  const { turmaId } = useParams();
  const [turma, setTurma] = useState(null);
  const [turmaLength, setTurmaLength] = useState(0)
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function verifyAuthentication() {
      try {
        const response = await fetch(`${API_BASE}/api/teacher/auth`);
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
        const authResponse = await fetch(`${API_BASE}/api/teacher/auth`);
        if (!authResponse.ok) throw new Error();
        const data = await authResponse.json();
        const nome = data["teacher"]["nome_completo"] || "Não encontrado.";
        setNomeCompleto(nome);
        return nome
      } catch (error) {
        setNomeCompleto("Erro ao carregar.");
        return null;
      }
    }

    async function getTurma() {
      try {
        const response = await fetch(`${API_BASE}/api/teacher/search/turma?turma=${turmaId}`)
        if (!response.ok) throw new Error()
        const data = await response.json()
        setTurma(data["turma"])
      } catch (error) {
        setTurma(null)
      }
    }

    async function getTotalAlunos() {
      try {
        const turmaRes = await fetch(`${API_BASE}/api/teacher/search/turma?turma=${turmaId}`)
        if (!turmaRes.ok) throw new Error()
        const turmaData = await turmaRes.json()
        const nomeTurma = turmaData.turma?.turma
        if (!nomeTurma) throw new Error()

        const alunosRes = await fetch(
          `${API_BASE}/api/teacher/get/alunos?turma=${encodeURIComponent(nomeTurma)}`
        )
        if (!alunosRes.ok) throw new Error()
        const alunosData = await alunosRes.json()

        setTurmaLength(alunosData.total || 0)
      } catch (error) {
        setTurmaLength(0)
      }
    }

    async function init() {
      await verifyAuthentication();
      await getData();
      await getTurma()
      await getTotalAlunos()
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
    const nomeTurma = turma?.turma || "Turma";
    const etapa = turma?.etapa || "";
    const disciplina = turma?.disciplina_lecionada || "";
    const escola = turma?.escola || "";

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
              <Link href="/professor/turmas" className={layoutStyles.navLinkActive}>
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
              <Link href="/professor/frequencia" className={layoutStyles.navLink}>
                <i className="ti ti-clipboard-check" aria-hidden="true" />
                Frequência
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
              <span className={layoutStyles.topbarTitle}>Painel da turma</span>
            </header>

            <main className={layoutStyles.main}>
              <Link href="/professor/turmas" className={styles.voltarLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6l-6 6l6 6" />
                </svg>
                Minhas turmas
              </Link>

              <div className={styles.turmaHero}>
                <div className={styles.turmaHeroSelo}>
                  {etapa?.charAt(0) || "?"}ª
                </div>
                <div className={styles.turmaHeroInfo}>
                  <h1 className={styles.turmaHeroNome}>{nomeTurma}</h1>
                  <p className={styles.turmaHeroDetalhe}>
                    {etapa}{escola && ` · ${escola}`}
                  </p>
                  {disciplina && (
                    <span className={styles.turmaHeroChip}>{disciplina}</span>
                  )}
                </div>
              </div>

              <section className={styles.acoesGrid}>
                <Link href={`/professor/turmas/${turmaId}/alunos`} className={styles.acaoCard}>
                  <span className={`${styles.acaoIcone} ${styles.corAzul}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                      <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
                    </svg>
                  </span>
                  <p className={styles.acaoTitulo}>Lista de alunos</p>
                  <p className={styles.acaoValor}>{turmaLength}</p>
                  <p className={styles.acaoLegenda}>aluno(s) matriculado(s)</p>
                </Link>

                <Link href={`/professor/notas/${turmaId}`} className={styles.acaoCard}>
                  <span className={`${styles.acaoIcone} ${styles.corRoxo}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
                      <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
                    </svg>
                  </span>
                  <p className={styles.acaoTitulo}>Lançar notas</p>
                  <p className={styles.acaoLegenda}>Registrar notas trimestrais</p>
                </Link>

                <Link href={`/professor/frequencia/turma/${turmaId}`} className={styles.acaoCard}>
                  <span className={`${styles.acaoIcone} ${styles.corVerde}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
                      <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
                      <path d="M9 14l2 2l4 -4" />
                    </svg>
                  </span>
                  <p className={styles.acaoTitulo}>Frequência</p>
                  <p className={styles.acaoLegenda}>Registrar presença e falta</p>
                </Link>

                <div className={`${styles.acaoCard} ${styles.acaoDesabilitada}`}>
                  <span className={`${styles.acaoIcone} ${styles.corLaranja}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6" />
                    </svg>
                  </span>
                  <p className={styles.acaoTitulo}>Notificações</p>
                  <p className={styles.acaoLegenda}>Em breve</p>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    );
  }
  return null
}