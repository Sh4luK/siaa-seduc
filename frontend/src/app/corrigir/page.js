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
    href: "/corrigir/disciplinas",
    label: "Disciplinas",
    description: "Renomeie disciplinas e corrija vínculos órfãos que não batem com nenhuma disciplina cadastrada.",
  },
  {
    href: "/corrigir/turmas",
    label: "Turmas",
    description: "Corrija nomes de turma divergentes entre professores e alunos.",
  },
  {
    href: "/corrigir/alunos",
    label: "Alunos",
    description: "Mova alunos para a turma correta rapidamente.",
  },
];

export default function CorrigirDashboardPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/coordenacao/login");
          return;
        }
        setAuthenticated(true);
      } catch {
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
      <div className={styles.wrapper}>
        <Link href="/coordenacao" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Coordenação
        </Link>

        <h1 className={styles.title}>Correção de dados</h1>
        <p className={styles.subtitle}>
          Ferramenta de manutenção — corrige divergências entre o cadastro e o horário oficial das turmas.
        </p>

        <div className={styles.grid}>
          {CARDS.map((card) => (
            <Link key={card.href} href={card.href} className={styles.card}>
              <span className={styles.cardLabel}>{card.label}</span>
              <span className={styles.cardDescription}>{card.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}