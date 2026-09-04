"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import layoutStyles from "../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function TabsResponsavel({ alunoId, ativa }) {
  const abas = [
    { key: "painel", label: "Painel", href: `/responsavel/${alunoId}` },
    { key: "boletim", label: "Boletim", href: `/responsavel/${alunoId}/boletim` },
    { key: "frequencia", label: "Frequência", href: `/responsavel/${alunoId}/frequencia` },
    { key: "horario", label: "Horário", href: `/responsavel/${alunoId}/horario` },
    { key: "mensagem", label: "Mensagens", href: `/responsavel/${alunoId}/mensagem` },
    { key: "comunicados", label: "Comunicados", href: `/responsavel/${alunoId}/comunicados` },
    { key: "advertencias", label: "Advertências", href: `/responsavel/${alunoId}/advertencias` },
    { key: "avaliacoes", label: "Avaliações", href: `/responsavel/${alunoId}/avaliacoes` },
    { key: "calendario", label: "Calendário", href: `/responsavel/${alunoId}/calendario` },
  ];
  return (
    <div className={layoutStyles.tabsRow}>
      {abas.map((aba) => (
        <Link key={aba.key} href={aba.href} className={ativa === aba.key ? layoutStyles.tabLinkActive : layoutStyles.tabLink}>{aba.label}</Link>
      ))}
    </div>
  );
}

export default function MensagemHubPage() {
  const router = useRouter();
  const params = useParams();
  const alunoId = params.alunoId;

  const [loading, setLoading] = useState(true);
  const [indoParaCoordenacao, setIndoParaCoordenacao] = useState(false);

  useEffect(() => {
    async function init() {
      const authRes = await fetch(`${API_BASE}/api/responsavel/auth`);
      const authData = await authRes.json();
      if (!authData.return) {
        router.push("/responsavel/login");
        return;
      }
      setLoading(false);
    }
    init();
  }, [router]);

  async function abrirCoordenacao() {
    setIndoParaCoordenacao(true);
    try {
      const res = await fetch(`${API_BASE}/api/responsavel/alunos/${alunoId}/mensagem/coordenador/status`);
      const data = await res.json();
      if (data.conversa_id) {
        router.push(`/responsavel/${alunoId}/mensagem/coordenador/${data.conversa_id}`);
      } else {
        router.push(`/responsavel/${alunoId}/mensagem/coordenador/enviar`);
      }
    } finally {
      setIndoParaCoordenacao(false);
    }
  }

  if (loading) {
    return <div className={layoutStyles.pageLoading}><div className={layoutStyles.cardLoading}><p className={layoutStyles.subtituloLoading}>Carregando…</p></div></div>;
  }

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.topBar}>Governo do Estado do Piauí — Secretaria de Estado da Educação</div>
      <div className={layoutStyles.wrapper}>
        <Link href="/responsavel" className={layoutStyles.voltarLink}>← Painel</Link>
        <TabsResponsavel alunoId={alunoId} ativa="mensagem" />

        <h1 className={layoutStyles.title}>Mensagens</h1>
        <p className={layoutStyles.subtitle}>Fale com um professor ou com a coordenação.</p>

        <div className={styles.opcoes}>
          <Link href={`/responsavel/${alunoId}/mensagem/professor`} className={styles.opcaoCard}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21v-13l9 -4l9 4v13" /><path d="M13 13h4v8h-10v-6h6" />
            </svg>
            <span>Falar com um professor</span>
          </Link>

          <button onClick={abrirCoordenacao} disabled={indoParaCoordenacao} className={styles.opcaoCard}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="7" r="4" /><path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
            </svg>
            <span>{indoParaCoordenacao ? "Abrindo..." : "Falar com a coordenação"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}