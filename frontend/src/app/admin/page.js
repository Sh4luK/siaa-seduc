"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "/backend-api";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Painel",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
        <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
        <path d="M9 21v-6a2 2 0 0 1 2 -1h2a2 2 0 0 1 2 1v6" />
      </svg>
    ),
  },
  {
    href: "/admin/escolas",
    label: "Escolas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21v-14l8 -4l8 4v14" />
        <path d="M17 21v-8" />
        <path d="M7 21v-8" />
      </svg>
    ),
  },
  {
    href: "/admin/coordenadores",
    label: "Coordenadores",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0 -4 -4h-8a4 4 0 0 0 -4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "/admin/professores",
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
    href: "/admin/alunos",
    label: "Alunos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" />
        <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
      </svg>
    ),
  },
  {
    href: "/admin/turmas",
    label: "Turmas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
        <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
      </svg>
    ),
  },
];

function getSaudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function AdminDashboardPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState({ coordenadores: null, professores: null, alunos: null, turmas: null, escolas: null });
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/admin/auth`, { credentials: "include" });
        const authData = await authRes.json();

        if (!authData.return) {
          setAuthenticated(false);
          router.push("/admin/login");
          return;
        }
        setAuthenticated(true);
        setAdmin(authData.admin || null);
      } catch (error) {
        setAuthenticated(false);
        router.push("/admin/login");
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
        const [coordRes, profRes, alunosRes, turmasRes, escolasRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/coordenadores`, { credentials: "include" }),
          fetch(`${API_BASE}/api/admin/professores`, { credentials: "include" }),
          fetch(`${API_BASE}/api/admin/alunos`, { credentials: "include" }),
          fetch(`${API_BASE}/api/admin/turmas`, { credentials: "include" }),
          fetch(`${API_BASE}/api/admin/escolas`, { credentials: "include" }),
        ]);

        const coordData = coordRes.ok ? await coordRes.json() : null;
        const profData = profRes.ok ? await profRes.json() : null;
        const alunosData = alunosRes.ok ? await alunosRes.json() : null;
        const turmasData = turmasRes.ok ? await turmasRes.json() : null;
        const escolasData = escolasRes.ok ? await escolasRes.json() : null;

        setStats({
          coordenadores: coordData?.length ?? 0,
          professores: profData?.length ?? 0,
          alunos: alunosData?.length ?? 0,
          turmas: turmasData?.length ?? 0,
          escolas: escolasData?.length ?? 0,
        });
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
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

  const primeiroNome = admin?.nome_completo?.split(" ")[0] || "";

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
                className={item.href === "/admin" ? styles.navLinkActive : styles.navLink}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <span className={styles.adminName}>{admin?.nome_completo}</span>
            <span className={styles.adminRole}>Administrador SEDUC-PI</span>
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
            <span className={styles.topbarTitle}>Painel Administrativo</span>
          </header>

          <main className={styles.main}>
            <h1 className={styles.greeting}>
              {getSaudacao()}{primeiroNome ? `, ${primeiroNome}` : ""}
            </h1>
            <p className={styles.subtitle}>
              Gerencie todo o banco de dados do sistema SIAA.
            </p>

            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.statIconCiano}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" />
                    <path d="M5 21v-14l8 -4l8 4v14" />
                    <path d="M17 21v-8" />
                    <path d="M7 21v-8" />
                  </svg>
                </span>
                <div>
                  <span className={styles.statValor}>{stats.escolas ?? "…"}</span>
                  <span className={styles.statLabel}>Escolas</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.statIconRoxo}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0 -4 -4h-8a4 4 0 0 0 -4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <div>
                  <span className={styles.statValor}>{stats.coordenadores ?? "…"}</span>
                  <span className={styles.statLabel}>Coordenadores</span>
                </div>
              </div>

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
                <span className={`${styles.statIcon} ${styles.statIconLaranja}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                    <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
                  </svg>
                </span>
                <div>
                  <span className={styles.statValor}>{stats.turmas ?? "…"}</span>
                  <span className={styles.statLabel}>Turmas</span>
                </div>
              </div>
            </div>

            <div className={styles.grid}>
              {NAV_ITEMS.slice(1).map((item) => (
                <Link key={item.href} href={item.href} className={styles.card}>
                  <span className={styles.iconCircle}>{item.icon}</span>
                  <div className={styles.cardBody}>
                    <span className={styles.cardLabel}>{item.label}</span>
                    <span className={styles.cardDescription}>Gerencie {item.label.toLowerCase()} do sistema</span>
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

          <footer className={styles.footer}>
            <div className={styles.footerContent}>
              <div className={styles.footerLogos}>
                <Image src={logo} alt="Logo do SIAA" className={styles.footerLogoSiaa} priority />
                <span className={styles.footerSeparator}>|</span>
                <span className={styles.footerSeduc}>SEDUC-PI</span>
              </div>
              <span className={styles.footerText}>© 2026 SEDUC-PI. Todos os direitos reservados.</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
