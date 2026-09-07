import Image from "next/image";
import Link from "next/link";
import logo from "../assets/CalistoLogoLogo.png";
import styles from "./page.module.css";

const ACCESS_POINTS = [
  {
    href: "/aluno",
    label: "Aluno",
    description: "Veja notas, frequência e horários de aula.",
    tab: "student",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" />
        <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
      </svg>
    ),
  },
  {
    href: "/responsavel",
    label: "Responsável",
    description: "Acompanhe o desempenho do seu filho ou filha.",
    tab: "guardian",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
        <path d="M17 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
        <path d="M3 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
        <path d="M4.5 18a4.5 4.5 0 0 1 15 0" />
        <path d="M2.5 17a3.5 3.5 0 0 1 3 -3.5" />
        <path d="M21.5 17a3.5 3.5 0 0 0 -3 -3.5" />
      </svg>
    ),
  },
  {
    href: "/professor",
    label: "Professor",
    description: "Lance notas, registre frequência e gerencie turmas.",
    tab: "teacher",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21v-13l9 -4l9 4v13" />
        <path d="M13 13h4v8h-10v-6h6" />
        <path d="M13 21v-9a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v3" />
      </svg>
    ),
  },
  {
    href: "/coordenacao",
    label: "Coordenador",
    description: "Gerencie alunos, turmas, professores e configurações do sistema.",
    tab: "staff",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-1a1 1 0 0 0 -1 -1h-2a1 1 0 0 1 -1 -1v-1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1" />
        <path d="M12 7v1m0 8v1" />
        <path d="M3 6a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.topBar}>
        <span>Governo do Estado do Piauí</span>
        <span className={styles.topBarDivider} aria-hidden="true" />
        <span>Secretaria de Estado da Educação</span>
      </div>

      <div className={styles.container}>
        <div className={styles.masthead}>
          <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
          <div className={styles.mastheadText}>
            <p className={styles.eyebrow}>Portal de Acesso</p>
            <h1 className={styles.title}>SIAA</h1>
            <p className={styles.subtitle}>
              Sistema Integrado de Acompanhamento Acadêmico. Selecione seu perfil para continuar.
            </p>
          </div>
        </div>

        <div className={styles.grid}>
          {ACCESS_POINTS.map((point) => (
            <Link key={point.href} href={point.href} className={styles.card} data-tab={point.tab}>
              <span className={styles.iconCircle}>{point.icon}</span>
              <div className={styles.cardBody}>
                <span className={styles.cardLabel}>{point.label}</span>
                <span className={styles.cardDescription}>{point.description}</span>
              </div>
              <span className={styles.cardArrow} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        <footer className={styles.footer}>
          <span className={styles.rule} aria-hidden="true" />
          <p>&copy; 2026 SIAA · Secretaria de Estado da Educação do Piauí</p>
        </footer>
      </div>
    </main>
  );
}