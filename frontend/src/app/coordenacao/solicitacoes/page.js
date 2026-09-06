"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

const STATUS_LABEL = { PENDENTE: "Pendente", APROVADO: "Aprovado", RECUSADO: "Recusado" };

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function SolicitacoesCoordenacaoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [erro, setErro] = useState(null);
  const [filtro, setFiltro] = useState("TODOS"); // TODOS | PENDENTE | APROVADO | RECUSADO
  const router = useRouter();

  const carregar = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/solicitacoes`);
      if (!res.ok) throw new Error(`Falha ao buscar solicitações (status ${res.status})`);
      const data = await res.json();
      setSolicitacoes(data.solicitacoes || []);
    } catch (e) {
      setErro(e.message);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/coordenacao/login");
          return;
        }
        setAuthenticated(true);
        await carregar();
      } catch (error) {
        setErro(`Erro ao carregar dados: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, carregar]);

  async function responder(id, decisao) {
    setErro(null);
    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/solicitacoes/${id}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisao }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Não foi possível responder.");
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <p className={styles.subtituloLoading}>Carregando…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  const solicitacoesFiltradas = filtro === "TODOS" ? solicitacoes : solicitacoes.filter((s) => s.status === filtro);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>Governo do Estado do Piauí — Secretaria de Estado da Educação</div>
      <div className={styles.wrapper}>
        <Link href="/coordenacao" className={styles.voltarLink}>← Coordenação</Link>

        <h1 className={styles.title}>Solicitações de responsáveis</h1>
        <p className={styles.subtitle}>Vínculos entre responsáveis e alunos da sua escola.</p>

        <div className={styles.filtros}>
          {["TODOS", "PENDENTE", "APROVADO", "RECUSADO"].map((f) => (
            <button
              key={f}
              className={filtro === f ? styles.filtroAtivo : styles.filtroBotao}
              onClick={() => setFiltro(f)}
            >
              {f === "TODOS" ? "Todos" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>

        {erro && <div className={styles.erro}>{erro}</div>}

        {solicitacoesFiltradas.length === 0 ? (
          <p className={styles.vazio}>Nenhuma solicitação encontrada.</p>
        ) : (
          <ul className={styles.lista}>
            {solicitacoesFiltradas.map((s) => (
              <li key={s.id} className={styles.card}>
                <div className={styles.cardInfo}>
                  <div className={styles.cardTopo}>
                    <p className={styles.aluno}>{s.aluno_nome}</p>
                    <span
                      className={
                        s.status === "APROVADO" ? styles.badgeAprovado
                          : s.status === "RECUSADO" ? styles.badgeRecusado
                          : styles.badgePendente
                      }
                    >
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <p className={styles.meta}>
                    Responsável: {s.responsavel_nome} ({s.parentesco}) · Turma: {s.aluno_turma || "—"}
                  </p>
                  <p className={styles.meta}>
                    Solicitado por {s.origem === "ALUNO" ? "aluno" : "responsável"} em {formatarData(s.data_solicitacao)}
                  </p>
                </div>

                {s.status === "PENDENTE" && (
                  <div className={styles.acoes}>
                    <button onClick={() => responder(s.id, "APROVADO")} className={styles.aprovarBtn}>Aprovar</button>
                    <button onClick={() => responder(s.id, "RECUSADO")} className={styles.recusarBtn}>Recusar</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}