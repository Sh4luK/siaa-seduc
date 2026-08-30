"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_BASE = "https://humble-spoon-4j654556jr9vf5qp6-8000.app.github.dev";

export default function BlogLoginPage() {
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function verificarSessao() {
      try {
        const res = await fetch(`${API_BASE}/api/blog/auth`);
        const data = await res.json();
        if (data.return === true) {
          router.push("/blog");
          return;
        }
      } catch (error) {
        // segue para mostrar o formulário
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
      const url = `${API_BASE}/api/blog/login?nome_completo=${encodeURIComponent(nomeCompleto.trim())}&senha=${encodeURIComponent(senha.trim())}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Falha ao autenticar (status ${res.status})`);
      const data = await res.json();

      if (data.return === true) {
        router.push("/blog");
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
      <div className={styles.pageLoading}>
        <p className={styles.subtituloLoading}>Verificando sessão…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.titulo}>Área do Blogger</h1>
          <p className={styles.subtitulo}>Entre para publicar novidades no blog.</p>
        </div>

        {erro && <p className={styles.erro}>{erro}</p>}

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="nome_completo">Nome completo</label>
            <input
              id="nome_completo"
              type="text"
              className={styles.input}
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              className={styles.input}
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