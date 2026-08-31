"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const API_BASE = "https://humble-spoon-4j654556jr9vf5qp6-8000.app.github.dev";

export default function AvaliacoesPage() {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch(`${API_BASE}/api/teacher/avaliacoes`, {
          credentials: "include",
        });
        if (!res.ok) {
          const corpoErro = await res.text();
          let message = "Erro ao carregar avaliações";
          try {
            message = JSON.parse(corpoErro).message || message;
          } catch {}
          throw new Error(message);
        }
        const data = await res.json();
        setAvaliacoes(data.avaliacoes);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  async function emitirPdf(id, titulo) {
    try {
      const res = await fetch(`${API_BASE}/api/teacher/avaliacoes/${id}/pdf`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao gerar PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${titulo}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Avaliações</h1>
        <Link href="/professor/avaliacoes/novo" className={styles.novoBotao}>
          + Nova avaliação
        </Link>
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className={styles.erro}>{erro}</p>}

      <div className={styles.grid}>
        {avaliacoes.map((a) => (
          <div key={a.id} className={styles.card}>
            <Link href={`/professor/avaliacoes/${a.id}`} className={styles.cardLink}>
              <h3>{a.titulo}</h3>
              <p>{a.disciplina} — Turma {a.turma}</p>
              <p className={styles.meta}>{a.total_questoes} questões · {a.data}</p>
            </Link>
            <button className={styles.pdfBotao} onClick={() => emitirPdf(a.id, a.titulo)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M12 18v-6" />
                <path d="M9 15l3 3 3-3" />
              </svg>
              Emitir PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}