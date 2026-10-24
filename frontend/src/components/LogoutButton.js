"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./LogoutButton.module.css";
import SessionTimer from "./SessionTimer";

const API_BASE = "/backend-api";

const SESSOES = [
  { prefixo: "/aluno", tipo: "ALUNO", login: "/aluno/login" },
  { prefixo: "/professor", tipo: "PROFESSOR", login: "/professor/login" },
  { prefixo: "/coordenacao", tipo: "COORDENADOR", login: "/coordenacao/login" },
  { prefixo: "/corrigir", tipo: "COORDENADOR", login: "/coordenacao/login" },
  { prefixo: "/responsavel", tipo: "RESPONSAVEL", login: "/responsavel/login" },
  { prefixo: "/blog", tipo: "BLOG", login: "/blog/login" },
];

function correspondeARota(pathname, prefixo) {
  return pathname === prefixo || pathname.startsWith(`${prefixo}/`);
}

function obterSessaoDaRota(pathname) {
  const sessao = SESSOES.find(({ prefixo }) => correspondeARota(pathname, prefixo));
  if (!sessao || pathname === sessao.login) return null;
  if (pathname === "/responsavel/registrar") return null;
  return sessao;
}

export default function LogoutButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [blogAutenticadoEm, setBlogAutenticadoEm] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false);

  const sessao = obterSessaoDaRota(pathname);
  const rotaBlog = sessao?.tipo === "BLOG";
  const loginPath = sessao?.login;
  const redirecionarParaLogin = useCallback(() => {
    if (loginPath) router.replace(loginPath);
  }, [loginPath, router]);

  useEffect(() => {
    if (!rotaBlog) return;

    let ativo = true;
    fetch(`${API_BASE}/api/blog/auth`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        if (ativo) setBlogAutenticadoEm(data.return === true ? pathname : "");
      })
      .catch(() => {
        if (ativo) setBlogAutenticadoEm("");
      });

    return () => {
      ativo = false;
    };
  }, [pathname, rotaBlog]);

  const blogAutenticado = blogAutenticadoEm === pathname;

  async function handleLogout() {
    if (!sessao) return;

    setEnviando(true);
    setErro("");
    try {
      const response = await fetch(`${API_BASE}/api/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: sessao.tipo }),
      });
      const data = await response.json();
      if (!response.ok || data.return !== true) {
        throw new Error(data.detail || "Não foi possível sair da conta.");
      }
      router.replace(sessao.login);
    } catch (error) {
      setErro(error.message || "Não foi possível sair da conta.");
    } finally {
      setEnviando(false);
    }
  }

  if (!sessao || (rotaBlog && !blogAutenticado)) return null;

  return (
    <div className={styles.container}>
      <button
        className={styles.botao}
        type="button"
        onClick={() => {
          setErro("");
          setConfirmacaoAberta((aberta) => !aberta);
        }}
        disabled={enviando}
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
        </svg>
        {enviando ? "Saindo..." : "Sair"}
      </button>
      <section
        className={styles.confirmacao}
        role="dialog"
        aria-label="Confirmar saída da conta"
        hidden={!confirmacaoAberta}
      >
        <p>
          Deseja mesmo sair desta conta? Seu tempo de sessão é{" "}
          <SessionTimer
            tipo={sessao.tipo}
            visivel={confirmacaoAberta}
            onExpirou={redirecionarParaLogin}
          />.
        </p>
        {erro && <p className={styles.erro} role="alert">{erro}</p>}
        <div className={styles.acoes}>
          <button
            className={styles.botaoSecundario}
            type="button"
            onClick={() => setConfirmacaoAberta(false)}
            disabled={enviando}
          >
            Cancelar
          </button>
          <button
            className={styles.botaoConfirmar}
            type="button"
            onClick={handleLogout}
            disabled={enviando}
          >
            {enviando ? "Saindo..." : "Sair da conta"}
          </button>
        </div>
      </section>
    </div>
  );
}
