// import Image from "next/image";
// import Link from "next/link";
// import logo from "../assets/logo.png";
// import styles from "./page.module.css";

// const ACCESS_POINTS = [
//   {
//     href: "/aluno",
//     monogram: "A",
//     label: "Aluno",
//     description: "Veja notas, frequência e horários de aula.",
//   },
//   {
//     href: "/responsavel",
//     monogram: "R",
//     label: "Responsável",
//     description: "Acompanhe o desempenho do seu filho ou filha.",
//   },
//   {
//     href: "/professor",
//     monogram: "P",
//     label: "Professor",
//     description: "Lance notas, registre frequência e gerencie turmas.",
//   },
//   {
//     href: "/coordenacao",
//     monogram: "C",
//     label: "Coordenador",
//     description: "Gerencie alunos, turmas ,professores e configurações do sistema.",
//   },
// ];

// export default function Home() {
//   return (
//     <main className={styles.page}>
//       <div className={styles.hall}>
//         <div className={styles.masthead}>
//           <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
//           <p className={styles.eyebrow}>Sistema Integrado de Acompanhamento Acadêmico</p>
//           <h1 className={styles.title}>Bem-vindo ao SIAA</h1>
//           <p className={styles.subtitle}>Escolha como deseja acessar o sistema.</p>
//         </div>

//         <div className={styles.grid}>
//           {ACCESS_POINTS.map((point) => (
//             <Link key={point.href} href={point.href} className={styles.tile}>
//               <span className={styles.seal} aria-hidden="true">
//                 {point.monogram}
//               </span>
//               <span className={styles.tileLabel}>{point.label}</span>
//               <span className={styles.tileDescription}>{point.description}</span>
//               <span className={styles.tileArrow} aria-hidden="true">→</span>
//             </Link>
//           ))}
//         </div>

//         <footer className={styles.footer}>
//           <span className={styles.rule} aria-hidden="true" />
//           <small>&copy; 2026 SIAA · Secretaria de Estado da Educação - PI</small>
//         </footer>
//       </div>
//     </main>
//   );
// }

// import Image from "next/image";
// import Link from "next/link";
// import logo from "../assets/logo.png";
// import styles from "./page.module.css";

// const ACCESS_POINTS = [
//   {
//     href: "/aluno",
//     monogram: "A",
//     label: "Aluno",
//     description: "Veja notas, frequência e horários de aula.",
//   },
//   {
//     href: "/responsavel",
//     monogram: "R",
//     label: "Responsável",
//     description: "Acompanhe o desempenho do seu filho ou filha.",
//   },
//   {
//     href: "/professor",
//     monogram: "P",
//     label: "Professor",
//     description: "Lance notas, registre frequência e gerencie turmas.",
//   },
//   {
//     href: "/coordenacao",
//     monogram: "C",
//     label: "Coordenador",
//     description: "Gerencie alunos, turmas, professores e configurações do sistema.",
//   },
// ];

// export default function Home() {
//   return (
//     <main className={styles.page}>
//       <div className={styles.frame}>
//         <span className={`${styles.corner} ${styles.cornerTl}`} aria-hidden="true" />
//         <span className={`${styles.corner} ${styles.cornerTr}`} aria-hidden="true" />
//         <span className={`${styles.corner} ${styles.cornerBl}`} aria-hidden="true" />
//         <span className={`${styles.corner} ${styles.cornerBr}`} aria-hidden="true" />

//         <div className={styles.hall}>
//           <div className={styles.masthead}>
//             <Image src={logo} alt="Brasão do SIAA" className={styles.logo} priority />
//             <p className={styles.registryNumber}>Registro Nº SIAA·2026 — Piauí</p>
//             <h1 className={styles.title}>Sistema Integrado de<br />Acompanhamento Acadêmico</h1>
//             <p className={styles.subtitle}>
//               Secretaria de Estado da Educação. Escolha seu ponto de acesso ao registro.
//             </p>
//           </div>

//           <div className={styles.rule} aria-hidden="true" />

//           <ul className={styles.ledger}>
//             {ACCESS_POINTS.map((point, index) => (
//               <li key={point.href} className={styles.entry}>
//                 <Link href={point.href} className={styles.entryLink}>
//                   <span className={styles.entryIndex}>{String(index + 1).padStart(2, "0")}</span>
//                   <span className={styles.seal} aria-hidden="true">{point.monogram}</span>
//                   <span className={styles.entryBody}>
//                     <span className={styles.entryLabel}>{point.label}</span>
//                     <span className={styles.entryDescription}>{point.description}</span>
//                   </span>
//                   <span className={styles.entryArrow} aria-hidden="true">→</span>
//                 </Link>
//               </li>
//             ))}
//           </ul>

//           <footer className={styles.footer}>
//             <span className={styles.rule} aria-hidden="true" />
//             <small>&copy; 2026 SIAA · Secretaria de Estado da Educação — PI</small>
//           </footer>
//         </div>
//       </div>
//     </main>
//   );
// }


// import Image from "next/image";
// import Link from "next/link";
// import logo from "../assets/logo.png";
// import styles from "./page.module.css";

// const ACCESS_POINTS = [
//   {
//     href: "/aluno",
//     monogram: "A",
//     label: "Aluno",
//     description: "Veja notas, frequência e horários de aula.",
//   },
//   {
//     href: "/responsavel",
//     monogram: "R",
//     label: "Responsável",
//     description: "Acompanhe o desempenho do seu filho ou filha.",
//   },
//   {
//     href: "/professor",
//     monogram: "P",
//     label: "Professor",
//     description: "Lance notas, registre frequência e gerencie turmas.",
//   },
//   {
//     href: "/coordenacao",
//     monogram: "C",
//     label: "Coordenador",
//     description: "Gerencie alunos, turmas, professores e configurações do sistema.",
//   },
// ];

// export default function Home() {
//   return (
//     <main className={styles.page}>
//       <div className={styles.board}>
//         <div className={styles.masthead}>
//           <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
//           <p className={styles.chalkTag}>Turma 2026 · Secretaria de Estado da Educação — PI</p>
//           <h1 className={styles.title}>Bem-vindo ao SIAA</h1>
//           <p className={styles.subtitle}>
//             Sistema Integrado de Acompanhamento Acadêmico. Escolha seu acesso na chamada.
//           </p>
//         </div>

//         <div className={styles.dashedRule} aria-hidden="true" />

//         <ul className={styles.roll}>
//           {ACCESS_POINTS.map((point, index) => (
//             <li key={point.href} className={styles.entry}>
//               <Link href={point.href} className={styles.entryLink}>
//                 <span className={styles.indexWrap}>
//                   <svg
//                     className={styles.circleMark}
//                     viewBox="0 0 64 64"
//                     aria-hidden="true"
//                   >
//                     <path
//                       className={styles.circlePath}
//                       d="M32 6 C 48 6, 58 16, 58 32 C 58 48, 47 58, 32 58 C 17 59, 6 48, 6 32 C 6 17, 16 7, 32 6"
//                       fill="none"
//                     />
//                   </svg>
//                   <span className={styles.entryIndex}>{String(index + 1).padStart(2, "0")}</span>
//                 </span>

//                 <span className={styles.entryBody}>
//                   <span className={styles.entryLabel}>{point.label}</span>
//                   <span className={styles.entryDescription}>{point.description}</span>
//                 </span>

//                 <span className={styles.entryArrow} aria-hidden="true">presente →</span>
//               </Link>
//             </li>
//           ))}
//         </ul>

//         <footer className={styles.tray}>
//           <span className={styles.chalkStick} aria-hidden="true" />
//           <small>&copy; 2026 SIAA · Secretaria de Estado da Educação — PI</small>
//         </footer>
//       </div>
//     </main>
//   );
// }


// import Image from "next/image";
// import Link from "next/link";
// import logo from "../assets/logo.png";
// import styles from "./page.module.css";

// const ACCESS_POINTS = [
//   {
//     href: "/aluno",
//     monogram: "A",
//     label: "Aluno",
//     description: "Veja notas, frequência e horários de aula.",
//     tab: "student",
//   },
//   {
//     href: "/responsavel",
//     monogram: "R",
//     label: "Responsável",
//     description: "Acompanhe o desempenho do seu filho ou filha.",
//     tab: "guardian",
//   },
//   {
//     href: "/professor",
//     monogram: "P",
//     label: "Professor",
//     description: "Lance notas, registre frequência e gerencie turmas.",
//     tab: "teacher",
//   },
//   {
//     href: "/coordenacao",
//     monogram: "C",
//     label: "Coordenador",
//     description: "Gerencie alunos, turmas, professores e configurações do sistema.",
//     tab: "staff",
//   },
// ];

// export default function Home() {
//   return (
//     <main className={styles.page}>
//       <div className={styles.container}>
//         <div className={styles.masthead}>
//           <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
//           <p className={styles.eyebrow}>Secretaria de Estado da Educação — PI</p>
//           <h1 className={styles.title}>SIAA</h1>
//           <p className={styles.subtitle}>
//             Sistema Integrado de Acompanhamento Acadêmico. Selecione sua ficha de acesso.
//           </p>
//         </div>

//         <div className={styles.grid}>
//           {ACCESS_POINTS.map((point) => (
//             <Link
//               key={point.href}
//               href={point.href}
//               className={styles.card}
//               data-tab={point.tab}
//             >
//               <span className={styles.tab} aria-hidden="true" />
//               <div className={styles.cardContent}>
//                 <span className={styles.monogram}>{point.monogram}</span>
//                 <span className={styles.cardLabel}>{point.label}</span>
//                 <span className={styles.cardDescription}>{point.description}</span>
//               </div>
//               <span className={styles.cardArrow} aria-hidden="true">
//                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M5 12h14" />
//                   <path d="M13 6l6 6-6 6" />
//                 </svg>
//               </span>
//             </Link>
//           ))}
//         </div>

//         <footer className={styles.footer}>
//           <small>&copy; 2026 SIAA · Secretaria de Estado da Educação — PI</small>
//         </footer>
//       </div>
//     </main>
//   );
// }


import Image from "next/image";
import Link from "next/link";
import logo from "../assets/logo2.png";
import styles from "./page.module.css";

const ACCESS_POINTS = [
  {
    href: "/aluno",
    monogram: "A",
    label: "Aluno",
    description: "Veja notas, frequência e horários de aula.",
    tab: "student",
  },
  {
    href: "/responsavel",
    monogram: "R",
    label: "Responsável",
    description: "Acompanhe o desempenho do seu filho.",
    tab: "guardian",
  },
  {
    href: "/professor",
    monogram: "P",
    label: "Professor",
    description: "Lance notas, registre frequência e gerencie turmas.",
    tab: "teacher",
  },
  {
    href: "/coordenacao",
    monogram: "C",
    label: "Coordenador",
    description: "Gerencie alunos, turmas, professores e configurações do sistema.",
    tab: "staff",
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* <div className={styles.masthead}>
          <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
          <p className={styles.eyebrow}>Secretaria de Estado da Educação — PI</p>
          <h1 className={styles.title}>SIAA</h1>
          <p className={styles.subtitle}>
            Sistema Integrado de Acompanhamento Acadêmico. Selecione sua ficha de acesso.
          </p>
        </div> */}
        <div className={styles.masthead}>
          <div className={styles.mastheadText}>
            <p className={styles.eyebrow}>Secretaria de Estado da Educação — PI</p>
            <h1 className={styles.title}>SIAA</h1>
            <p className={styles.subtitle}>
              Sistema Integrado de Acompanhamento Acadêmico. Selecione sua ficha de acesso.
            </p>
          </div>
          <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
        </div>

        <div className={styles.grid}>
          {ACCESS_POINTS.map((point) => (
            <Link
              key={point.href}
              href={point.href}
              className={styles.card}
              data-tab={point.tab}
            >
              <span className={styles.tab} aria-hidden="true" />
              <div className={styles.cardContent}>
                <span className={styles.monogram}>{point.monogram}</span>
                <span className={styles.cardLabel}>{point.label}</span>
                <span className={styles.cardDescription}>{point.description}</span>
              </div>
              <span className={styles.cardArrow} aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        <footer className={styles.footer}>
          <small>&copy; 2026 SIAA · Secretaria de Estado da Educação — PI</small>
        </footer>
      </div>
    </main>
  );
}