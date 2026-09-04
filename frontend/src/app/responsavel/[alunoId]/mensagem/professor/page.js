"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import layoutStyles from "../../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function formatarDataHora(iso) {
  const data = new Date(iso);
  const hoje = new Date();
  if (data.toDateString() === hoje.toDateString()) return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function MensagemProfessorListaPage() {
  const router = useRouter();
  const params = useParams();
  const alunoId = params.alunoId;

  const [loading, setLoading] = useState(true);
  const [conversas, setConversas] = useState([]);
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
        const res = await fetch(`${API_BASE}/api/responsavel/alunos/${alunoId}/mensagem/professor`);
        if (!res.ok) throw new Error(`Falha ao carregar conversas (status ${res.status})`);
        setConversas(await res.json());
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
        <Link href={`/responsavel/${alunoId}/mensagem`} className={layoutStyles.voltarLink}>← Mensagens</Link>

        <div className={styles.header}>
          <h1 className={layoutStyles.title}>Conversas com professores</h1>
          <Link href={`/responsavel/${alunoId}/mensagem/professor/enviar`} className={styles.novaMensagemBtn}>
            + Nova mensagem
          </Link>
        </div>

        {erro && <div className={layoutStyles.erro}>{erro}</div>}

        {!erro && conversas.length === 0 ? (
          <p className={styles.estadoVazioCard}>Nenhuma conversa ainda.</p>
        ) : (
          <div className={styles.lista}>
            {conversas.map((c) => (
              <Link key={c.id} href={`/responsavel/${alunoId}/mensagem/professor/${c.id}`} className={styles.card}>
                <div className={styles.avatar}>{c.professor_nome?.charAt(0)?.toUpperCase() || "P"}</div>
                <div className={styles.cardInfo}>
                  <div className={styles.cardTopo}>
                    <span className={styles.professorNome}>{c.professor_nome}</span>
                    <span className={styles.dataHora}>{formatarDataHora(c.ultima_atualizacao)}</span>
                  </div>
                  <p className={styles.previaMensagem}>{c.ultima_mensagem || "Sem mensagens ainda"}</p>
                </div>
                {c.nao_lidas > 0 && <span className={styles.badge}>{c.nao_lidas}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}