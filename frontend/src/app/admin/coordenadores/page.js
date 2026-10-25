"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "/backend-api";

export default function AdminCoordenadoresPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coordenadores, setCoordenadores] = useState([]);
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [escola, setEscola] = useState("");
  const [criando, setCriando] = useState(false);
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
        await carregarCoordenadores();
      } catch (error) {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function carregarCoordenadores() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/coordenadores`, { credentials: "include" });
      const data = await res.json();
      setCoordenadores(data || []);
    } catch (error) {
      console.error("Erro ao carregar coordenadores:", error);
    }
  }

  async function handleCriar(e) {
    e.preventDefault();
    setCriando(true);

    try {
      const res = await fetch(`${API_BASE}/api/admin/coordenadores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nome_completo: nome, senha, escola }),
      });

      if (res.ok) {
        setNome("");
        setSenha("");
        setEscola("");
        await carregarCoordenadores();
      }
    } catch (error) {
      console.error("Erro ao criar coordenador:", error);
    } finally {
      setCriando(false);
    }
  }

  async function handleExcluir(id) {
    if (!confirm("Tem certeza que deseja excluir este coordenador?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/coordenadores/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        await carregarCoordenadores();
      }
    } catch (error) {
      console.error("Erro ao excluir coordenador:", error);
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
        <h1>Coordenadores</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.formCard}>
          <h2>Novo Coordenador</h2>
          <form onSubmit={handleCriar}>
            <div className={styles.field}>
              <label>Nome completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Escola</label>
              <input
                type="text"
                value={escola}
                onChange={(e) => setEscola(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={criando}>
              {criando ? "Criando..." : "Criar Coordenador"}
            </button>
          </form>
        </div>

        <div className={styles.listCard}>
          <h2>Coordenadores Cadastrados ({coordenadores.length})</h2>
          <div className={styles.list}>
            {coordenadores.length === 0 ? (
              <p className={styles.empty}>Nenhum coordenador cadastrado.</p>
            ) : (
              coordenadores.map((coord) => (
                <div key={coord.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <strong>{coord.nome_completo}</strong>
                    <span>{coord.escola}</span>
                  </div>
                  <button
                    onClick={() => handleExcluir(coord.id)}
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
