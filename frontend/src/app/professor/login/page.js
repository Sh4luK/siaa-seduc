"use client";

import logo from "../../../assets/logo.png";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";
import Image from "next/image";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function ProfessorLoginPage() {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await fetch(`${API_BASE}/api/teacher/auth`);
        const data = await res.json();

        if (data.return === true) {
          setAuthenticated(true);
          router.push("/professor");
          return;
        }
        setAuthenticated(false);
      } catch (error) {
        setAuthenticated(false);
      } finally {
        setLoadingAuth(false);
      }
    }

    verifyAuth();
  }, [router]);

  async function auth_teacher_button() {
    if (!nomeCompleto.trim() || !password.trim()) {
      setError("Preencha nome completo e senha.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = `${API_BASE}/api/teacher/login?nome_completo=${encodeURIComponent(nomeCompleto)}&senha=${encodeURIComponent(password)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.return === true) {
        router.push("/professor");
      } else {
        setError("Nome completo ou senha incorretos. Verifique suas credenciais.");
      }
    } catch (error) {
      setError("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Enquanto verifica se já existe sessão ativa, mostra o loading padrão
  // (evita renderizar o formulário antes de saber se deve redirecionar).
  if (loadingAuth) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
          <div className={styles.loadingBar}>
            <span className={styles.loadingBarFill} />
          </div>
          <p className={styles.loadingText}>Verificando credenciais…</p>
        </div>
      </div>
    );
  }

  // Se já está autenticado, o useEffect já disparou o redirect — não renderiza nada.
  if (authenticated === true) {
    return null;
  }

  return (
    <div className={`${styles.page} ${styles.pageCentered}`}>
      <div className={styles.card}>
        <div className={styles.cardBody}>
          <div className={styles.masthead}>
            <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
            <p className={styles.eyebrow}>SIAA · Acesso do professor</p>
            <h2 className={styles.title}>Login do professor</h2>
          </div>

          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>
                Nome Completo <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                name="nome_completo"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Senha <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                className={styles.input}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className={styles.errorBox} role="alert">
                <span className={styles.errorIcon} aria-hidden="true">!</span>
                <small>{error}</small>
              </div>
            )}

            <button
              onClick={auth_teacher_button}
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </div>
        </div>

        <footer className={styles.footer}>
          <small>&copy; 2026 SEDUC-PI. Todos os direitos reservados.</small>
        </footer>
      </div>
    </div>
  );
}