// /responsavel/[alunoId]/comunicados/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import layoutStyles from "../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

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

export default function ComunicadosAlunoResponsavelPage() {
  const router = useRouter();
  const params = useParams();
  const alunoId = params.alunoId;

  const [loading, setLoading] = useState(true);
  const [comunicados, setComunicados] = useState([]);
  const [aluno, setAluno] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/responsavel/auth`);
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/responsavel/login");
          return;
        }
        const res = await fetch(`${API_BASE}/api/responsavel/alunos/${alunoId}/comunicados`);
        if (res.status === 403) throw new Error("Você não tem acesso aprovado a este aluno.");
        if (!res.ok) throw new Error(`Falha ao buscar comunicados (status ${res.status})`);
        const data = await res.json();
        setAluno(data.aluno);
        setComunicados(data.comunicados || []);
      } catch (error) {
        setErro(error.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, alunoId]);

  if (loading) {
    return <div className={layoutStyles.pageLoading}><div className={layoutStyles.cardLoading}><p className={layoutStyles.subtituloLoading}>Carregando…</p></div></div>;
  }

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.topBar}>Governo do Estado do Piauí — Secretaria de Estado da Educação</div>
      <div className={layoutStyles.wrapper}>
        <Link href="/responsavel" className={layoutStyles.voltarLink}>← Painel</Link>
        <TabsResponsavel alunoId={alunoId} ativa="comunicados" />

        {erro ? (
          <div className={layoutStyles.erro}>{erro}</div>
        ) : (
          <>
            <h1 className={layoutStyles.title}>Comunicados</h1>
            <p className={layoutStyles.subtitle}>{aluno?.nome_completo} · {aluno?.turma}</p>

            {comunicados.length === 0 ? (
              <p className={styles.vazio}>Nenhum comunicado até o momento.</p>
            ) : (
              <ul className={styles.lista}>
                {comunicados.map((c) => (
                  <li key={c.id} className={styles.card}>
                    <div className={styles.cardIcone}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 9h8" /><path d="M8 13h6" />
                        <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3z" />
                      </svg>
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardTopo}>
                        <p className={styles.cardTitulo}>{c.titulo}</p>
                        <span className={styles.cardData}>{formatarData(c.data)}</span>
                      </div>
                      <span className={styles.disciplinaBadge}>{c.criado_por}</span>
                      <p className={styles.cardDescricao}>{c.mensagem}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}