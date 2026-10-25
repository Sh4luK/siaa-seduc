"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "/backend-api";

export default function AdminProfessoresPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [professores, setProfessores] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/admin/auth`, { credentials: "include" });
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/admin/login");
          return;
        }
        setAuthenticated(true);
        await carregarProfessores();
      } catch (error) {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function carregarProfessores() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/professores`, { credentials: "include" });
      const data = await res.json();
      setProfessores(data || []);
    } catch (error) {
      console.error("Erro ao carregar professores:", error);
    }
  }

  async function handleExcluir(id) {
    if (!confirm("Tem certeza que deseja excluir este professor?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/professores/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        await carregarProfessores();
      }
    } catch (error) {
      console.error("Erro ao excluir professor:", error);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  if (authenticated !== true) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/admin" className={styles.backLink}>
          ← Voltar ao painel
        </Link>
        <h1>Professores</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.listCard}>
          <h2>Professores Cadastrados ({professores.length})</h2>
          <div className={styles.list}>
            {professores.length === 0 ? (
              <p className={styles.empty}>Nenhum professor cadastrado.</p>
            ) : (
              professores.map((prof) => (
                <div key={prof.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <strong>{prof.nome_completo}</strong>
                    <span>ID: {prof.id}</span>
                  </div>
                  <button
                    onClick={() => handleExcluir(prof.id)}
                    className={styles.deleteButton}
                  >
                    Excluir
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

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
  );
}
