"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import layoutStyles from "../../../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function EnviarMensagemProfessorPage() {
  const router = useRouter();
  const params = useParams();
  const alunoId = params.alunoId;

  const [loading, setLoading] = useState(true);
  const [professores, setProfessores] = useState([]);
  const [professorId, setProfessorId] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function init() {
      const authRes = await fetch(`${API_BASE}/api/responsavel/auth`);
      const authData = await authRes.json();
      if (!authData.return) {
        router.push("/responsavel/login");
        return;
      }
      const res = await fetch(`${API_BASE}/api/responsavel/alunos/${alunoId}/mensagem/professor/opcoes`);
      if (res.ok) {
        const data = await res.json();
        setProfessores(data.professores || []);
      }
      setLoading(false);
    }
    init();
  }, [router, alunoId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (!professorId) { setErro("Selecione um professor."); return; }
    if (!conteudo.trim()) { setErro("Escreva uma mensagem."); return; }

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/responsavel/alunos/${alunoId}/mensagem/professor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professor_id: professorId, conteudo: conteudo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Não foi possível enviar a mensagem.");
      router.push(`/responsavel/${alunoId}/mensagem/professor/${data.conversa_id}`);
    } catch (e2) {
      setErro(e2.message);
      setEnviando(false);
    }
  }

  if (loading) {
    return <div className={layoutStyles.pageLoading}><div className={layoutStyles.cardLoading}><p className={layoutStyles.subtituloLoading}>Carregando…</p></div></div>;
  }

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.topBar}>Governo do Estado do Piauí — Secretaria de Estado da Educação</div>
      <div className={layoutStyles.wrapper}>
        <Link href={`/responsavel/${alunoId}/mensagem/professor`} className={layoutStyles.voltarLink}>← Conversas</Link>

        <h1 className={layoutStyles.title}>Nova mensagem</h1>

        <form className={styles.card} onSubmit={handleSubmit}>
          <label className={styles.campo}>
            <span className={styles.label}>Professor</span>
            <select value={professorId} onChange={(e) => setProfessorId(e.target.value)} className={styles.select}>
              <option value="">Selecione um professor</option>
              {professores.map((p) => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
            </select>
          </label>

          <label className={styles.campo}>
            <span className={styles.label}>Mensagem</span>
            <textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={6} className={styles.textarea} />
          </label>

          {erro && <div className={styles.erro}>{erro}</div>}

          <button type="submit" disabled={enviando} className={styles.enviarBtn}>
            {enviando ? "Enviando..." : "Enviar mensagem"}
          </button>
        </form>
      </div>
    </div>
  );
}