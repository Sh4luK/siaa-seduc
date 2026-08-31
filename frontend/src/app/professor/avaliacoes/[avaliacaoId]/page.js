"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_BASE = "https://humble-spoon-4j654556jr9vf5qp6-8000.app.github.dev";

export default function VisualizarAvaliacaoPage() {
  const { avaliacaoId } = useParams();
  const router = useRouter();
  const [avaliacao, setAvaliacao] = useState(null);
  const [erro, setErro] = useState(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch(`${API_BASE}/api/teacher/avaliacoes/${avaliacaoId}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const corpoErro = await res.text();
          let message = "Erro ao carregar avaliação";
          try {
            message = JSON.parse(corpoErro).message || message;
          } catch {}
          throw new Error(message);
        }
        setAvaliacao(await res.json());
      } catch (e) {
        setErro(e.message);
      }
    }
    carregar();
  }, [avaliacaoId]);

  async function excluir() {
    try {
      const res = await fetch(`${API_BASE}/api/teacher/avaliacoes/${avaliacaoId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      router.push("/professor/avaliacoes");
    } catch (e) {
      setErro(e.message);
    }
  }

  if (erro) return <p className={styles.erro}>{erro}</p>;
  if (!avaliacao) return <p>Carregando...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>{avaliacao.titulo}</h1>
          <p className={styles.meta}>
            {avaliacao.disciplina} — Turma {avaliacao.turma} · {avaliacao.data}
          </p>
        </div>
        <div className={styles.acoes}>
          <button
            className={styles.editarBotao}
            onClick={() => router.push(`/professor/avaliacoes/${avaliacaoId}/editar`)}
          >
            Editar
          </button>

          {!confirmandoExclusao ? (
            <button className={styles.excluirBotao} onClick={() => setConfirmandoExclusao(true)}>
              Excluir
            </button>
          ) : (
            <div className={styles.confirmacao}>
              <span>Confirmar exclusão?</span>
              <button onClick={excluir}>Sim</button>
              <button onClick={() => setConfirmandoExclusao(false)}>Não</button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.questoesLista}>
        {avaliacao.questoes.map((q, index) => (
          <div key={q.id} className={styles.questaoCard}>
            <div className={styles.questaoHeader}>
              <span>Questão {index + 1}</span>
              <span className={styles.tipoBadge}>{q.tipo === "OBJETIVA" ? "Objetiva" : "Subjetiva"}</span>
            </div>
            <p>{q.enunciado}</p>
            {q.imagem && <img src={q.imagem} alt="" className={styles.imagemPreview} />}
            {q.tipo === "OBJETIVA" && (
              <ul className={styles.alternativas}>
                {q.alternativas.map((alt) => (
                  <li key={alt.letra} className={alt.correta ? styles.correta : ""}>
                    {alt.letra}) {alt.texto}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}