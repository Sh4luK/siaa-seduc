"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function AdminLoginPage() {
  const router = useRouter();
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome_completo: nomeCompleto, senha }),
      });
      const data = await res.json();
      if (!data.return) throw new Error(data.detail || "Credenciais inválidas.");
      router.push("/admin");
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={styles.pageLoading}>
      <form onSubmit={handleSubmit} className={styles.cardLoading} style={{ textAlign: "left" }}>
        <h1 className={styles.title}>Administração</h1>
        <p className={styles.subtitle} style={{ marginBottom: "1.25rem" }}>Acesso restrito.</p>

        {erro && <div className={styles.erro}>{erro}</div>}

        <div className={styles.campo} style={{ marginTop: "1rem" }}>
          <label className={styles.label}>Nome completo</label>
          <input
            className={styles.input}
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
          />
        </div>

        <div className={styles.campo} style={{ marginTop: "1rem" }}>
          <label className={styles.label}>Senha</label>
          <input
            type="password"
            className={styles.input}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        <button type="submit" disabled={enviando} className={styles.enviarBtn} style={{ marginTop: "1.25rem" }}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}