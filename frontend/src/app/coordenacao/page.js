// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import Image from "next/image";
// import logo from "@/assets/logo.png";
// import styles from "./page.module.css";

// const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

// const CARDS = [
//   {
//     href: "/coordenacao/professores",
//     label: "Professores",
//     description: "Cadastre e gerencie vínculos de turma e disciplina.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M3 21v-13l9 -4l9 4v13" />
//         <path d="M13 13h4v8h-10v-6h6" />
//         <path d="M13 21v-9a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v3" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/alunos",
//     label: "Alunos",
//     description: "Consulte, cadastre e edite os dados dos alunos.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" />
//         <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/calendario",
//     label: "Calendário",
//     description: "Eventos e datas importantes da escola.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
//         <path d="M16 3v4" />
//         <path d="M8 3v4" />
//         <path d="M4 11h16" />
//         <path d="M11 15h1" />
//         <path d="M12 15v3" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/horarios",
//     label: "Horários",
//     description: "Grade de aulas semanal por turma.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M12 7v5l3 3" />
//         <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/advertencias",
//     label: "Advertências",
//     description: "Registros disciplinares de alunos e professores.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M12 9v4" />
//         <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
//         <path d="M12 16h.01" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/avaliacoes",
//     label: "Avaliações",
//     description: "Veja as avaliações cadastradas pelos professores.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M9 12h6" />
//         <path d="M9 16h6" />
//         <path d="M14 3v4a1 1 0 0 0 1 1h4" />
//         <path d="M5 3h9l5 5v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/comunicados",
//     label: "Comunicados",
//     description: "Avisos enviados para a escola.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
//         <path d="M3 7l9 6l9 -6" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/mensagem",
//     label: "Mensagens",
//     description: "Converse diretamente com os professores.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M8 9h8" />
//         <path d="M8 13h6" />
//         <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/notas",
//     label: "Notas",
//     description: "Consulte as notas lançadas por turma e disciplina.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M9 12h6" /><path d="M9 16h6" />
//         <path d="M14 3v4a1 1 0 0 0 1 1h4" />
//         <path d="M5 3h9l5 5v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/disciplinas",
//     label: "Disciplinas",
//     description: "Gerencie o cadastro de disciplinas da escola.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
//         <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
//         <path d="M3 6l0 13" /><path d="M12 6l0 13" /><path d="M21 6l0 13" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/solicitacoes",
//     label: "Solicitações",
//     description: "Vínculos entre responsáveis e alunos pendentes de aprovação.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M9 6l6 6l-6 6" />
//         <circle cx="12" cy="12" r="9" />
//       </svg>
//     ),
//   },
// ];

// export default function CoordenacaoDashboardPage() {
//   const [authenticated, setAuthenticated] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [coordenador, setCoordenador] = useState(null);
//   const router = useRouter();

//   useEffect(() => {
//     async function init() {
//       try {
//         const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
//         const authData = await authRes.json();

//         if (!authData.return) {
//           setAuthenticated(false);
//           router.push("/coordenacao/login");
//           return;
//         }
//         setAuthenticated(true);
//         setCoordenador(authData.coordenador || null);
//       } catch (error) {
//         setAuthenticated(false);
//         router.push("/coordenacao/login");
//       } finally {
//         setLoading(false);
//       }
//     }

//     init();
//   }, [router]);

//   if (loading) {
//     return (
//       <div className={styles.pageLoading}>
//         <div className={styles.cardLoading}>
//           <div className={styles.headerLoading}>
//             <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
//             <p className={styles.subtituloLoading}>Verificando credenciais…</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (authenticated !== true) return null;

//   return (
//     <div className={styles.page}>
//       <div className={styles.topBar}>
//         <span>Governo do Estado do Piauí</span>
//         <span className={styles.topBarDivider} aria-hidden="true" />
//         <span>Secretaria de Estado da Educação</span>
//       </div>

//       <div className={styles.wrapper}>
//         <div className={styles.masthead}>
//           <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
//           <div className={styles.mastheadText}>
//             <p className={styles.eyebrow}>Painel da Coordenação</p>
//             <h1 className={styles.title}>
//               {coordenador?.escola ? coordenador.escola : "Coordenação"}
//             </h1>
//             <p className={styles.subtitle}>Selecione uma área para gerenciar.</p>
//           </div>
//         </div>

//         <div className={styles.grid}>
//           {CARDS.map((card) => (
//             <Link key={card.href} href={card.href} className={styles.card}>
//               <span className={styles.iconCircle}>{card.icon}</span>
//               <div className={styles.cardBody}>
//                 <span className={styles.cardLabel}>{card.label}</span>
//                 <span className={styles.cardDescription}>{card.description}</span>
//               </div>
//               <span className={styles.cardArrow} aria-hidden="true">
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M9 6l6 6l-6 6" />
//                 </svg>
//               </span>
//             </Link>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import Image from "next/image";
// import logo from "@/assets/logo.png";
// import styles from "./page.module.css";

// const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

// const CARDS = [
//   {
//     href: "/coordenacao/professores",
//     label: "Professores",
//     description: "Cadastre e gerencie vínculos de turma e disciplina.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M3 21v-13l9 -4l9 4v13" />
//         <path d="M13 13h4v8h-10v-6h6" />
//         <path d="M13 21v-9a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v3" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/alunos",
//     label: "Alunos",
//     description: "Consulte, cadastre e edite os dados dos alunos.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" />
//         <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/calendario",
//     label: "Calendário",
//     description: "Eventos e datas importantes da escola.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
//         <path d="M16 3v4" />
//         <path d="M8 3v4" />
//         <path d="M4 11h16" />
//         <path d="M11 15h1" />
//         <path d="M12 15v3" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/horarios",
//     label: "Horários",
//     description: "Grade de aulas semanal por turma.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M12 7v5l3 3" />
//         <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/advertencias",
//     label: "Advertências",
//     description: "Registros disciplinares de alunos e professores.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M12 9v4" />
//         <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
//         <path d="M12 16h.01" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/avaliacoes",
//     label: "Avaliações",
//     description: "Veja as avaliações cadastradas pelos professores.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M9 12h6" />
//         <path d="M9 16h6" />
//         <path d="M14 3v4a1 1 0 0 0 1 1h4" />
//         <path d="M5 3h9l5 5v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/comunicados",
//     label: "Comunicados",
//     description: "Avisos enviados para a escola.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
//         <path d="M3 7l9 6l9 -6" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/mensagem",
//     label: "Mensagens",
//     description: "Converse diretamente com os professores.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M8 9h8" />
//         <path d="M8 13h6" />
//         <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/notas",
//     label: "Notas",
//     description: "Consulte as notas lançadas por turma e disciplina.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M9 12h6" /><path d="M9 16h6" />
//         <path d="M14 3v4a1 1 0 0 0 1 1h4" />
//         <path d="M5 3h9l5 5v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/disciplinas",
//     label: "Disciplinas",
//     description: "Gerencie o cadastro de disciplinas da escola.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
//         <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
//         <path d="M3 6l0 13" /><path d="M12 6l0 13" /><path d="M21 6l0 13" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/solicitacoes",
//     label: "Solicitações",
//     description: "Vínculos entre responsáveis e alunos pendentes de aprovação.",
//     icon: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M9 6l6 6l-6 6" />
//         <circle cx="12" cy="12" r="9" />
//       </svg>
//     ),
//   },
// ];

// function getSaudacao() {
//   const hora = new Date().getHours();
//   if (hora < 12) return "Bom dia";
//   if (hora < 18) return "Boa tarde";
//   return "Boa noite";
// }

// export default function CoordenacaoDashboardPage() {
//   const [authenticated, setAuthenticated] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [coordenador, setCoordenador] = useState(null);
//   const [stats, setStats] = useState({ professores: null, alunos: null, pendentes: null });
//   const router = useRouter();

//   useEffect(() => {
//     async function init() {
//       try {
//         const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
//         const authData = await authRes.json();

//         if (!authData.return) {
//           setAuthenticated(false);
//           router.push("/coordenacao/login");
//           return;
//         }
//         setAuthenticated(true);
//         setCoordenador(authData.coordenador || null);
//       } catch (error) {
//         setAuthenticated(false);
//         router.push("/coordenacao/login");
//       } finally {
//         setLoading(false);
//       }
//     }

//     init();
//   }, [router]);

//   useEffect(() => {
//     if (authenticated !== true) return;

//     async function carregarStats() {
//       try {
//         const [professoresRes, alunosRes, solicitacoesRes] = await Promise.all([
//           fetch(`${API_BASE}/api/coordenacao/professores`),
//           fetch(`${API_BASE}/api/coordenacao/alunos`),
//           fetch(`${API_BASE}/api/coordenacao/solicitacoes`),
//         ]);

//         const professoresData = professoresRes.ok ? await professoresRes.json() : null;
//         const alunosData = alunosRes.ok ? await alunosRes.json() : null;
//         const solicitacoesData = solicitacoesRes.ok ? await solicitacoesRes.json() : null;

//         const pendentes = (solicitacoesData?.solicitacoes || []).filter(
//           (s) => s.status === "PENDENTE"
//         ).length;

//         setStats({
//           professores: professoresData?.total_professores ?? null,
//           alunos: alunosData?.total_alunos ?? null,
//           pendentes,
//         });
//       } catch (error) {
//         // Estatísticas são um complemento visual — se falharem, a tela
//         // continua funcional, só sem os números no topo.
//       }
//     }

//     carregarStats();
//   }, [authenticated]);

//   if (loading) {
//     return (
//       <div className={styles.pageLoading}>
//         <div className={styles.cardLoading}>
//           <div className={styles.headerLoading}>
//             <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
//             <p className={styles.subtituloLoading}>Verificando credenciais…</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (authenticated !== true) return null;

//   const primeiroNome = coordenador?.nome_completo?.split(" ")[0] || "";

//   return (
//     <div className={styles.page}>
//       <div className={styles.topBar}>
//         <span>Governo do Estado do Piauí</span>
//         <span className={styles.topBarDivider} aria-hidden="true" />
//         <span>Secretaria de Estado da Educação</span>
//       </div>

//       <div className={styles.wrapper}>
//         <div className={styles.masthead}>
//           <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
//           <div className={styles.mastheadText}>
//             <p className={styles.eyebrow}>
//               {getSaudacao()}{primeiroNome ? `, ${primeiroNome}` : ""}
//             </p>
//             <h1 className={styles.title}>
//               {coordenador?.escola ? coordenador.escola : "Coordenação"}
//             </h1>
//             <p className={styles.subtitle}>Selecione uma área para gerenciar.</p>
//           </div>
//         </div>

//         <div className={styles.statsRow}>
//           <div className={styles.statCard}>
//             <span className={`${styles.statIcon} ${styles.statIconAzul}`}>
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <path d="M3 21v-13l9 -4l9 4v13" />
//                 <path d="M13 13h4v8h-10v-6h6" />
//               </svg>
//             </span>
//             <div>
//               <span className={styles.statValor}>{stats.professores ?? "…"}</span>
//               <span className={styles.statLabel}>Professores</span>
//             </div>
//           </div>

//           <div className={styles.statCard}>
//             <span className={`${styles.statIcon} ${styles.statIconVerde}`}>
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" />
//                 <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
//               </svg>
//             </span>
//             <div>
//               <span className={styles.statValor}>{stats.alunos ?? "…"}</span>
//               <span className={styles.statLabel}>Alunos</span>
//             </div>
//           </div>

//           <div className={styles.statCard}>
//             <span className={`${styles.statIcon} ${stats.pendentes > 0 ? styles.statIconAmbar : styles.statIconVerde}`}>
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <path d="M9 6l6 6l-6 6" />
//                 <circle cx="12" cy="12" r="9" />
//               </svg>
//             </span>
//             <div>
//               <span className={styles.statValor}>{stats.pendentes ?? "…"}</span>
//               <span className={styles.statLabel}>Solicitações pendentes</span>
//             </div>
//           </div>
//         </div>

//         <div className={styles.grid}>
//           {CARDS.map((card) => (
//             <Link key={card.href} href={card.href} className={styles.card}>
//               {card.href === "/coordenacao/solicitacoes" && stats.pendentes > 0 && (
//                 <span className={styles.cardBadge}>{stats.pendentes}</span>
//               )}
//               <span className={styles.iconCircle}>{card.icon}</span>
//               <div className={styles.cardBody}>
//                 <span className={styles.cardLabel}>{card.label}</span>
//                 <span className={styles.cardDescription}>{card.description}</span>
//               </div>
//               <span className={styles.cardArrow} aria-hidden="true">
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M9 6l6 6l-6 6" />
//                 </svg>
//               </span>
//             </Link>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

const NAV_ITEMS = [
  {
    href: "/coordenacao",
    label: "Início",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
        <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
        <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/professores",
    label: "Professores",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21v-13l9 -4l9 4v13" />
        <path d="M13 13h4v8h-10v-6h6" />
        <path d="M13 21v-9a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v3" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/alunos",
    label: "Alunos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" />
        <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/calendario",
    label: "Calendário",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
        <path d="M16 3v4" />
        <path d="M8 3v4" />
        <path d="M4 11h16" />
        <path d="M11 15h1" />
        <path d="M12 15v3" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/horarios",
    label: "Horários",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 7v5l3 3" />
        <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/advertencias",
    label: "Advertências",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4" />
        <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
        <path d="M12 16h.01" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/avaliacoes",
    label: "Avaliações",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6" />
        <path d="M9 16h6" />
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M5 3h9l5 5v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/comunicados",
    label: "Comunicados",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
        <path d="M3 7l9 6l9 -6" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/mensagem",
    label: "Mensagens",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 9h8" />
        <path d="M8 13h6" />
        <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/notas",
    label: "Notas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6" /><path d="M9 16h6" />
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M5 3h9l5 5v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/disciplinas",
    label: "Disciplinas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
        <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
        <path d="M3 6l0 13" /><path d="M12 6l0 13" /><path d="M21 6l0 13" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/solicitacoes",
    label: "Solicitações",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6l6 6l-6 6" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
];

// Os mesmos itens de navegação, com descrição — usados nos cards do painel.
const CARDS = [
  { ...NAV_ITEMS[1], description: "Cadastre e gerencie vínculos de turma e disciplina." },
  { ...NAV_ITEMS[2], description: "Consulte, cadastre e edite os dados dos alunos." },
  { ...NAV_ITEMS[3], description: "Eventos e datas importantes da escola." },
  { ...NAV_ITEMS[4], description: "Grade de aulas semanal por turma." },
  { ...NAV_ITEMS[5], description: "Registros disciplinares de alunos e professores." },
  { ...NAV_ITEMS[6], description: "Veja as avaliações cadastradas pelos professores." },
  { ...NAV_ITEMS[7], description: "Avisos enviados para a escola." },
  { ...NAV_ITEMS[8], description: "Converse diretamente com os professores." },
  { ...NAV_ITEMS[9], description: "Consulte as notas lançadas por turma e disciplina." },
  { ...NAV_ITEMS[10], description: "Gerencie o cadastro de disciplinas da escola." },
  { ...NAV_ITEMS[11], description: "Vínculos entre responsáveis e alunos pendentes de aprovação." },
];

function getSaudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function CoordenacaoDashboardPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coordenador, setCoordenador] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState({ professores: null, alunos: null, pendentes: null });
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          setAuthenticated(false);
          router.push("/coordenacao/login");
          return;
        }
        setAuthenticated(true);
        setCoordenador(authData.coordenador || null);
      } catch (error) {
        setAuthenticated(false);
        router.push("/coordenacao/login");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  useEffect(() => {
    if (authenticated !== true) return;

    async function carregarStats() {
      try {
        const [professoresRes, alunosRes, solicitacoesRes] = await Promise.all([
          fetch(`${API_BASE}/api/coordenacao/professores`),
          fetch(`${API_BASE}/api/coordenacao/alunos`),
          fetch(`${API_BASE}/api/coordenacao/solicitacoes`),
        ]);

        const professoresData = professoresRes.ok ? await professoresRes.json() : null;
        const alunosData = alunosRes.ok ? await alunosRes.json() : null;
        const solicitacoesData = solicitacoesRes.ok ? await solicitacoesRes.json() : null;

        const pendentes = (solicitacoesData?.solicitacoes || []).filter(
          (s) => s.status === "PENDENTE"
        ).length;

        setStats({
          professores: professoresData?.total_professores ?? null,
          alunos: alunosData?.total_alunos ?? null,
          pendentes,
        });
      } catch (error) {
        // Estatísticas são um complemento visual — falha aqui não deve
        // travar a tela, só deixar os números sem carregar.
      }
    }

    carregarStats();
  }, [authenticated]);

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <div className={styles.headerLoading}>
            <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
            <p className={styles.subtituloLoading}>Verificando credenciais…</p>
          </div>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  const primeiroNome = coordenador?.nome_completo?.split(" ")[0] || "";

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.sidebarHeader}>
            <Image src={logo} alt="Logo do SIAA" className={styles.sidebarLogo} priority />
            <span className={styles.sidebarBrand}>SIAA</span>
          </div>

          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.href === "/coordenacao" ? styles.navLinkActive : styles.navLink}
              >
                {item.icon}
                {item.label}
                {item.href === "/coordenacao/solicitacoes" && stats.pendentes > 0 && (
                  <span className={styles.navBadge}>{stats.pendentes}</span>
                )}
              </Link>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <span className={styles.coordName}>{coordenador?.nome_completo}</span>
            <span className={styles.coordEscola}>{coordenador?.escola}</span>
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
            <span className={styles.topbarTitle}>Painel da Coordenação</span>
          </header>

          <main className={styles.main}>
            <h1 className={styles.greeting}>
              {getSaudacao()}{primeiroNome ? `, ${primeiroNome}` : ""}
            </h1>
            <p className={styles.subtitle}>
              {coordenador?.escola ? coordenador.escola : "Selecione uma área para gerenciar."}
            </p>

            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.statIconAzul}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21v-13l9 -4l9 4v13" />
                    <path d="M13 13h4v8h-10v-6h6" />
                  </svg>
                </span>
                <div>
                  <span className={styles.statValor}>{stats.professores ?? "…"}</span>
                  <span className={styles.statLabel}>Professores</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.statIconVerde}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" />
                    <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
                  </svg>
                </span>
                <div>
                  <span className={styles.statValor}>{stats.alunos ?? "…"}</span>
                  <span className={styles.statLabel}>Alunos</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${stats.pendentes > 0 ? styles.statIconAmbar : styles.statIconVerde}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6l-6 6" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </span>
                <div>
                  <span className={styles.statValor}>{stats.pendentes ?? "…"}</span>
                  <span className={styles.statLabel}>Solicitações pendentes</span>
                </div>
              </div>
            </div>

            <div className={styles.grid}>
              {CARDS.map((card) => (
                <Link key={card.href} href={card.href} className={styles.card}>
                  {card.href === "/coordenacao/solicitacoes" && stats.pendentes > 0 && (
                    <span className={styles.cardBadge}>{stats.pendentes}</span>
                  )}
                  <span className={styles.iconCircle}>{card.icon}</span>
                  <div className={styles.cardBody}>
                    <span className={styles.cardLabel}>{card.label}</span>
                    <span className={styles.cardDescription}>{card.description}</span>
                  </div>
                  <span className={styles.cardArrow} aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6l-6 6" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}