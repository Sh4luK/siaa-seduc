"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

const CARDS = [
  {
    href: "/admin/coordenadores",
    label: "Coordenadores",
    description: "Criar e remover coordenadores por escola.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
      </svg>
    ),
  },
  {
    href: "/admin/professores",
    label: "Professores",
    description: "Criar e remover professores.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21v-13l9 -4l9 4v13" />
        <path d="M13 13h4v8h-10v-6h6" />
      </svg>
    ),
  },
  {
    href: "/admin/alunos",
    label: "Alunos",
    description: "Criar e remover alunos.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" />
        <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
      </svg>
    ),
  },
  {
    href: "/admin/turmas",
    label: "Turmas",
    description: "Listar turmas existentes e renomear.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 10h16" />
        <path d="M10 4v16" />
      </svg>
    ),
  },
];

export default function AdminDashboardPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/auth`);
        const data = await res.json();
        if (!data.return) {
          router.push("/admin/login");
          return;
        }
        setAuthenticated(true);
      } catch {
        router.push("/admin/login");
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
          <p className={styles.subtituloLoading}>Verificando credenciais…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>Administração do sistema</div>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Painel administrativo</h1>
        <p className={styles.subtitle} style={{ marginBottom: "2rem" }}>
          Gestão de contas e turmas do SIAA-SEDUC.
        </p>

        <div className={styles.grid}>
          {CARDS.map((c) => (
            <Link key={c.href} href={c.href} className={styles.card}>
              <span className={styles.iconCircle}>{c.icon}</span>
              <div className={styles.cardBody}>
                <span className={styles.cardLabel}>{c.label}</span>
                <span className={styles.cardDescription}>{c.description}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}