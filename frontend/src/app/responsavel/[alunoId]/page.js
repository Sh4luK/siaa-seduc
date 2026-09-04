"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
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
    <div className={styles.tabsRow}>
      {abas.map((aba) => (
        <Link key={aba.key} href={aba.href} className={ativa === aba.key ? styles.tabLinkActive : styles.tabLink}>
          {aba.label}
        </Link>
      ))}
    </div>
  );
}

function formatarData(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  const meses = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  return `${Number(dia)} de ${meses[Number(mes) - 1]}`;
}

export default function DashboardAlunoResponsavelPage() {
  const router = useRouter();
  const params = useParams();
  const alunoId = params.alunoId;

  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
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

        const res = await fetch(`${API_BASE}/api/responsavel/alunos/${alunoId}/dashboard`);
        if (res.status === 403) {
          throw new Error("Você não tem acesso aprovado a este aluno.");
        }
        if (!res.ok) throw new Error(`Falha ao buscar dashboard (status ${res.status})`);
        setDashboard(await res.json());
      } catch (error) {
        setErro(error.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, alunoId]);

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <p className={styles.subtituloLoading}>Carregando painel…</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          Governo do Estado do Piauí — Secretaria de Estado da Educação
        </div>
        <div className={styles.wrapper}>
          <Link href="/responsavel" className={styles.voltarLink}>← Painel</Link>
          <div className={styles.erro}>{erro}</div>
        </div>
      </div>
    );
  }

  const firstName = dashboard?.aluno?.nome_completo?.split(" ")[0] || "";

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        Governo do Estado do Piauí — Secretaria de Estado da Educação
      </div>

      <TabsResponsavel alunoId={alunoId} ativa="painel" />

      <div className={styles.wrapper}>
        <Link href="/responsavel" className={styles.voltarLink}>← Painel</Link>

        <h1 className={styles.title}>{dashboard?.aluno?.nome_completo}</h1>
        <p className={styles.subtitle}>
          {dashboard?.aluno?.turma} · {dashboard?.aluno?.escola}
        </p>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.statIconAmbar}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
              </svg>
            </span>
            <span className={styles.statValor}>{dashboard?.total_pendencias ?? "—"}</span>
            <span className={styles.statLabel}>Pendentes</span>
          </div>

          <div className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.statIconVerde}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 17 9 11 13 15 21 7" />
                <polyline points="14 7 21 7 21 14" />
              </svg>
            </span>
            <span className={styles.statValor}>{dashboard?.media_geral ?? "—"}</span>
            <span className={styles.statLabel}>Média Geral</span>
          </div>

          <div className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.statIconAzul}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a9 9 0 0 0 9 9a9 9 0 0 0 -9 9a9 9 0 0 0 -9 -9a9 9 0 0 0 9 -9" />
              </svg>
            </span>
            <span className={styles.statValor}>
              {dashboard?.frequencia_percentual != null ? `${dashboard.frequencia_percentual}%` : "—"}
            </span>
            <span className={styles.statLabel}>Frequência</span>
            {dashboard?.frequencia_baixa_pe_de_meia && (
              <span className={styles.avisoPeDeMeia}>Abaixo do mínimo do Pé de Meia</span>
            )}
          </div>

          <div className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.statIconRoxo}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
                <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
                <path d="M3 6l0 13" />
                <path d="M12 6l0 13" />
                <path d="M21 6l0 13" />
              </svg>
            </span>
            <span className={styles.statValor}>{dashboard?.total_conteudos ?? "—"}</span>
            <span className={styles.statLabel}>Conteúdos</span>
          </div>
        </div>

        <div className={styles.duasColunas}>
          <div className={styles.painel}>
            <div className={styles.painelHeader}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" />
                <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
                <path d="M12 16h.01" />
              </svg>
              <span>Atenção Necessária</span>
            </div>

            {(!dashboard?.atencao_necessaria || dashboard.atencao_necessaria.length === 0) ? (
              <p className={styles.painelVazio}>Nenhuma disciplina com média abaixo de 6.</p>
            ) : (
              <ul className={styles.atencaoLista}>
                {dashboard.atencao_necessaria.map((item, i) => (
                  <li key={i} className={styles.atencaoItem}>
                    <span className={styles.atencaoDisciplina}>
                      <span className={styles.bolinha} />
                      {item.disciplina || "Disciplina"}
                    </span>
                    <span className={styles.atencaoValor}>Média: {item.media}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.painel}>
            <div className={styles.painelHeader}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 15" />
              </svg>
              <span>Próximas Entregas</span>
            </div>

            {(!dashboard?.proximas_entregas || dashboard.proximas_entregas.length === 0) ? (
              <p className={styles.painelVazio}>Nenhuma atividade pendente.</p>
            ) : (
              <ul className={styles.entregasLista}>
                {dashboard.proximas_entregas.map((item, i) => (
                  <li key={i} className={styles.entregaItem}>
                    <span className={styles.bolinha} />
                    <div className={styles.entregaInfo}>
                      <p className={styles.entregaTitulo}>{item.titulo}</p>
                      <p className={styles.entregaData}>
                        {item.disciplina ? `${item.disciplina} · ` : ""}
                        {formatarData(item.data_entrega)}
                      </p>
                    </div>
                    <span className={styles.badgePendente}>Pendente</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className={styles.painel} style={{ marginTop: "1rem" }}>
          <div className={styles.painelHeader}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="5" width="16" height="16" rx="2" />
              <path d="M16 3v4" />
              <path d="M8 3v4" />
              <path d="M4 11h16" />
            </svg>
            <span>Estudos Programados</span>
          </div>

          {(!dashboard?.estudos_programados || dashboard.estudos_programados.length === 0) ? (
            <p className={styles.painelVazio}>Nenhum estudo programado pelo aluno.</p>
          ) : (
            <ul className={styles.estudosLista}>
              {dashboard.estudos_programados.map((e) => (
                <li key={e.id} className={`${styles.estudoItem} ${e.concluido ? styles.estudoConcluido : ""}`}>
                  <span className={styles.bolinha} />
                  <div className={styles.entregaInfo}>
                    <p className={styles.entregaTitulo}>{e.titulo}</p>
                    <p className={styles.entregaData}>
                      {e.disciplina ? `${e.disciplina} · ` : ""}
                      {formatarData(e.data)}
                    </p>
                  </div>
                  {e.concluido && <span className={styles.badgeConcluido}>Concluído</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}