"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function BlogLoginPage() {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState("ALUNO");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const res = await fetch(`${API_BASE}/api/blog/login`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome_completo: nomeCompleto, senha, tipo }),
      });
      const data = await res.json();

      if (!data.return) {
        setErro(data.detail || "Nome ou senha inválidos.");
        return;
      }

      router.push("/blog");
    } catch (error) {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
        <h1 className={styles.title}>Entrar no Blog</h1>
        <p className={styles.subtitle}>Use as mesmas credenciais do seu perfil no SIAA.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Tipo de perfil
            <select
              className={styles.select}
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="ALUNO">Aluno</option>
              <option value="PROFESSOR">Professor</option>
              <option value="RESPONSAVEL">Responsável</option>
              <option value="COORDENADOR">Coordenador</option>
            </select>
          </label>

          <label className={styles.label}>
            Nome completo
            <input
              className={styles.input}
              type="text"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              required
            />
          </label>

          <label className={styles.label}>
            Senha
            <input
              className={styles.input}
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </label>

          {erro && <div className={styles.erro}>{erro}</div>}

          <button type="submit" className={styles.botao} disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}