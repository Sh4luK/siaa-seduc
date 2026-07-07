import Image from "next/image";
import Link from "next/link";
import logo from "../assets/logo.png";
import styles from "./page.module.css";

const ACCESS_POINTS = [
  {
    href: "/aluno",
    monogram: "A",
    label: "Aluno",
    description: "Veja notas, frequência e horários de aula.",
  },
  {
    href: "/responsavel",
    monogram: "R",
    label: "Responsável",
    description: "Acompanhe o desempenho do seu filho ou filha.",
  },
  {
    href: "/professor",
    monogram: "P",
    label: "Professor",
    description: "Lance notas, registre frequência e gerencie turmas.",
  },
  {
    href: "/administrador",
    monogram: "Ad",
    label: "Administrador",
    description: "Gerencie usuários, turmas e configurações do sistema.",
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.hall}>
        <div className={styles.masthead}>
          <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
          <p className={styles.eyebrow}>Sistema Integrado de Acompanhamento Acadêmico</p>
          <h1 className={styles.title}>Bem-vindo ao SIAA</h1>
          <p className={styles.subtitle}>Escolha como deseja acessar o sistema.</p>
        </div>

        <div className={styles.grid}>
          {ACCESS_POINTS.map((point) => (
            <Link key={point.href} href={point.href} className={styles.tile}>
              <span className={styles.seal} aria-hidden="true">
                {point.monogram}
              </span>
              <span className={styles.tileLabel}>{point.label}</span>
              <span className={styles.tileDescription}>{point.description}</span>
              <span className={styles.tileArrow} aria-hidden="true">→</span>
            </Link>
          ))}
        </div>

        <footer className={styles.footer}>
          <span className={styles.rule} aria-hidden="true" />
          <small>&copy; 2026 SIAA · Secretaria Acadêmica</small>
        </footer>
      </div>
    </main>
  );
}