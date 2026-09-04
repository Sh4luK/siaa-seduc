"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "../../../assets/logo.png";
import styles from "../page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function ResponsavelLoginPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function verificar() {
      try {
        const res = await fetch(`${API_BASE}/api/responsavel/auth`);
        const data = await res.json();
        if (data.return) {
          setAuthenticated(true);
          router.push("/responsavel");
          return;
        }
        setAuthenticated(false);
      } catch {
        setAuthenticated(false);
      } finally {
        setLoadingAuth(false);
      }
    }
    verificar();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (!nomeCompleto.trim() || !senha.trim()) {
      setErro("Preencha nome completo e senha.");
      return;
    }

    setEnviando(true);
    try {
      const url = `${API_BASE}/api/responsavel/login?nome_completo=${encodeURIComponent(nomeCompleto)}&senha=${encodeURIComponent(senha)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.return) {
        setErro("Nome completo ou senha incorretos.");
        return;
      }
      router.push("/responsavel");
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setEnviando(false);
    }
  }

  if (loadingAuth) {
    return (
      <div className={styles.centerPage}>
        <div className={styles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
          <p className={styles.loadingText}>Verificando credenciais…</p>
        </div>
      </div>
    );
  }

  if (authenticated === true) return null;

  return (
    <div className={styles.centerPage}>
      <div className={styles.card}>
        <div className={styles.cardBody}>
          <div className={styles.masthead}>
            <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
            <p className={styles.eyebrow}>SIAA · Acesso do responsável</p>
            <h2 className={styles.title}>Login do responsável</h2>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label}>Nome completo</label>
              <input
                type="text"
                className={styles.input}
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Senha</label>
              <input
                type="password"
                className={styles.input}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            {erro && <div className={styles.erro}>{erro}</div>}

            <button type="submit" disabled={enviando} className={styles.submitButton}>
              {enviando ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className={styles.hint} style={{ textAlign: "center", marginTop: "0.5rem" }}>
            Ainda não tem conta?{" "}
            <Link href="/responsavel/registrar" className={styles.linkInline}>
              Cadastre-se
            </Link>
          </p>
        </div>

        <footer className={styles.footer}>
          <small>&copy; 2026 SEDUC-PI. Todos os direitos reservados.</small>
        </footer>
      </div>
    </div>
  );
}