// "use client";

// import logo from "../../assets/logo.png"
// import Link from "next/link";
// import Image from "next/image";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import styles from "./page.module.css";

// const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

// const SECOES = [
//   {
//     href: "/coordenacao/professores",
//     label: "Professores",
//     descricao: "Gerencie o corpo docente, disciplinas e turmas atribuídas.",
//     cor: "azul",
//     icone: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
//         <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
//         <path d="M16 3.13a4 4 0 0 1 0 7.75" />
//         <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/alunos",
//     label: "Alunos",
//     descricao: "Consulte matrículas, turmas e o histórico acadêmico dos estudantes.",
//     cor: "verde",
//     icone: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" />
//         <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/calendario",
//     label: "Calendário Escolar",
//     descricao: "Visualize e organize eventos e datas importantes da escola.",
//     cor: "roxo",
//     icone: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
//         <path d="M16 3v4" />
//         <path d="M8 3v4" />
//         <path d="M4 11h16" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/horarios",
//     label: "Horários",
//     descricao: "Administre os horários de aula de turmas e professores.",
//     cor: "laranja",
//     icone: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
//         <path d="M12 7v5l3 3" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/advertencias",
//     label: "Advertências",
//     descricao: "Acompanhe ocorrências disciplinares registradas na escola.",
//     cor: "vermelho",
//     icone: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M12 9v4" />
//         <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
//         <path d="M12 16h.01" />
//       </svg>
//     ),
//   },
//   {
//     href: "/coordenacao/comunicados",
//     label: "Comunicados",
//     descricao: "Envie e acompanhe comunicados para professores e turmas.",
//     cor: "amarelo",
//     icone: (
//       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M8 9h8" />
//         <path d="M8 13h6" />
//         <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3z" />
//       </svg>
//     ),
//   },
// ];

// export default function CoordenacaoPage() {
//   const [authenticated, setAuthenticated] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [busca, setBusca] = useState("");
//   const router = useRouter();

//   // Verifica se o coordenador está autenticado (via IP). Se não estiver,
//   // redireciona para a tela de login.
//   useEffect(() => {
//     async function verificarAutenticacao() {
//       try {
//         const res = await fetch(`${API_BASE}/api/coordenacao/auth`);
//         const data = await res.json();

//         if (data.return === true) {
//           setAuthenticated(true);
//         } else {
//           setAuthenticated(false);
//           router.push("/coordenacao/login");
//         }
//       } catch (error) {
//         setAuthenticated(false);
//         router.push("/coordenacao/login");
//       } finally {
//         setLoading(false);
//       }
//     }

//     verificarAutenticacao();
//   }, [router]);

//   const secoesFiltradas = SECOES.filter(
//     (s) =>
//       s.label.toUpperCase().includes(busca.trim().toUpperCase()) ||
//       s.descricao.toUpperCase().includes(busca.trim().toUpperCase())
//   );

//   if (loading) {
//     return (
//       <div className={styles.pageLoading}>
//         <div className={styles.cardLoading}>
//           <div className={styles.headerLoading}>
//             <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
//             <p className={styles.subtituloLoading}>Verificando sessão…</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (authenticated !== true) return null;

//   return (
//     <div className={styles.page}>
//       <div className={styles.wrapper}>
//         <div className={styles.headerRow}>
//           <div>
//             <h1 className={styles.title}>Coordenação</h1>
//             <p className={styles.subtitle}>
//               Acompanhe turmas, professores e o desempenho acadêmico da escola em um só lugar.
//             </p>
//           </div>
//         </div>

//         <div className={styles.buscaWrapper}>
//           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
//             <path d="M21 21l-6 -6" />
//           </svg>
//           <input
//             type="text"
//             placeholder="Buscar seção..."
//             className={styles.buscaInput}
//             value={busca}
//             onChange={(e) => setBusca(e.target.value)}
//           />
//         </div>

//         {secoesFiltradas.length === 0 ? (
//           <p className={styles.vazio}>Nenhuma seção encontrada para essa busca.</p>
//         ) : (
//           <div className={styles.grid}>
//             {secoesFiltradas.map((secao) => (
//               <Link key={secao.href} href={secao.href} className={styles.card}>
//                 <span className={`${styles.icone} ${styles[`cor_${secao.cor}`]}`}>
//                   {secao.icone}
//                 </span>
//                 <div className={styles.cardInfo}>
//                   <p className={styles.cardTitulo}>{secao.label}</p>
//                   <p className={styles.cardDescricao}>{secao.descricao}</p>
//                 </div>
//                 <span className={styles.cardArrow} aria-hidden="true">→</span>
//               </Link>
//             ))}
//           </div>
//         )}
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

const CARDS = [
  {
    href: "/coordenacao/professores",
    label: "Professores",
    description: "Cadastre e gerencie vínculos de turma e disciplina.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21v-13l9 -4l9 4v13" />
        <path d="M13 13h4v8h-10v-6h6" />
        <path d="M13 21v-9a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v3" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/alunos",
    label: "Alunos",
    description: "Consulte, cadastre e edite os dados dos alunos.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" />
        <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/calendario",
    label: "Calendário",
    description: "Eventos e datas importantes da escola.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    description: "Grade de aulas semanal por turma.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 7v5l3 3" />
        <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/advertencias",
    label: "Advertências",
    description: "Registros disciplinares de alunos e professores.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4" />
        <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
        <path d="M12 16h.01" />
      </svg>
    ),
  },
  {
    href: "/coordenacao/comunicados",
    label: "Comunicados",
    description: "Avisos enviados para a escola.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
        <path d="M3 7l9 6l9 -6" />
      </svg>
    ),
  },
];

export default function CoordenacaoDashboardPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coordenador, setCoordenador] = useState(null);
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

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <span>Governo do Estado do Piauí</span>
        <span className={styles.topBarDivider} aria-hidden="true" />
        <span>Secretaria de Estado da Educação</span>
      </div>

      <div className={styles.wrapper}>
        <div className={styles.masthead}>
          <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
          <div className={styles.mastheadText}>
            <p className={styles.eyebrow}>Painel da Coordenação</p>
            <h1 className={styles.title}>
              {coordenador?.escola ? coordenador.escola : "Coordenação"}
            </h1>
            <p className={styles.subtitle}>Selecione uma área para gerenciar.</p>
          </div>
        </div>

        <div className={styles.grid}>
          {CARDS.map((card) => (
            <Link key={card.href} href={card.href} className={styles.card}>
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
      </div>
    </div>
  );
}