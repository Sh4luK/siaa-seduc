"use client";

import logo from "../../../assets/logo.png"
import Image from "next/image"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css"

const API_BASE = "https://q0w7c17l-8000.brs.devtunnels.ms";

export default function CoordenacaoLoginPage() {
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Ao carregar a página de login, verifica se já existe uma sessão ativa
  // (coordenador autenticado via IP). Se sim, pula direto para /coordenacao.
  useEffect(() => {
    async function verificarSessao() {
      try {
        const res = await fetch(`${API_BASE}/api/coordenacao/auth`);
        const data = await res.json();

        if (data.return === true) {
          router.push("/coordenacao");
          return;
        }
      } catch (error) {
        // Se der erro na verificação, apenas segue para mostrar o formulário de login
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
      const url = `${API_BASE}/api/coordenacao/login?nome_completo=${encodeURIComponent(nomeCompleto.trim())}&senha=${encodeURIComponent(senha.trim())}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Falha ao autenticar (status ${res.status})`);
      const data = await res.json();

      if (data.return === true) {
        router.push("/coordenacao");
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
          <h1 className={styles.titulo}>Acesso da Coordenação</h1>
          <p className={styles.subtitulo}>
            Entre com suas credenciais para gerenciar a escola.
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