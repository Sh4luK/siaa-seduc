"use client";

import logo from "../../../assets/logo.png"
import Image from "next/image"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css"

const API_BASE = "/backend-api";

export default function AdminLoginPage() {
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function verificarSessao() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/auth`, { credentials: "include" });
        const data = await res.json();

        if (data.return === true) {
          router.push("/admin");
          return;
        }
      } catch (error) {
      } finally {
        setVerificandoSessao(false);
      }
    }

    verificarSessao();
  }, [router]);

  async function handleLogin(e) {
    e.preventDefault();
    setErro(null);

    if (!nomeCompleto.trim() || !senha.trim()) {
      setErro("Preencha nome completo e senha.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nome_completo: nomeCompleto.trim(), senha: senha.trim() }),
      });
      if (!res.ok) throw new Error(`Falha ao autenticar (status ${res.status})`);
      const data = await res.json();

      if (data.return === true) {
        router.push("/admin");
      } else {
        setErro("Nome completo ou senha incorretos.");
      }
    } catch (error) {
      setErro(`Erro ao entrar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (verificandoSessao) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
            <p className={styles.subtitulo}>Verificando sessão…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
          <h1 className={styles.titulo}>Acesso Administrativo</h1>
          <p className={styles.subtitulo}>
            Entre com suas credenciais para gerenciar o sistema.
          </p>
        </div>

        {erro && <p className={styles.erro}>{erro}</p>}

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="nome_completo">
              Nome completo
            </label>
            <input
              id="nome_completo"
              type="text"
              className={styles.input}
              placeholder="Digite seu nome completo"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              className={styles.input}
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className={styles.botao} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
