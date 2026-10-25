"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "/backend-api";

export default function AdminTurmasPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [turmas, setTurmas] = useState([]);
  const [nomeAtual, setNomeAtual] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [renomeando, setRenomeando] = useState(false);
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
        await carregarTurmas();
      } catch (error) {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function carregarTurmas() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/turmas`, { credentials: "include" });
      const data = await res.json();
      setTurmas(data || []);
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
    }
  }

  async function handleRenomear(e) {
    e.preventDefault();
    setRenomeando(true);

    try {
      const res = await fetch(`${API_BASE}/api/admin/turmas/renomear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nome_atual: nomeAtual, novo_nome: novoNome }),
      });

      if (res.ok) {
        setNomeAtual("");
        setNovoNome("");
        await carregarTurmas();
      }
    } catch (error) {
      console.error("Erro ao renomear turma:", error);
    } finally {
      setRenomeando(false);
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
        <h1>Turmas</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.formCard}>
          <h2>Renomear Turma</h2>
          <form onSubmit={handleRenomear}>
            <div className={styles.field}>
              <label>Nome atual da turma</label>
              <input
                type="text"
                value={nomeAtual}
                onChange={(e) => setNomeAtual(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Novo nome</label>
              <input
                type="text"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={renomeando}>
              {renomeando ? "Renomeando..." : "Renomear"}
            </button>
          </form>
        </div>

        <div className={styles.listCard}>
          <h2>Turmas Cadastradas ({turmas.length})</h2>
          <div className={styles.list}>
            {turmas.length === 0 ? (
              <p className={styles.empty}>Nenhuma turma cadastrada.</p>
            ) : (
              turmas.map((turma, index) => (
                <div key={index} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <strong>{typeof turma === 'object' ? turma.turma : turma}</strong>
                  </div>
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
