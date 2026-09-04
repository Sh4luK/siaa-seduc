"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import layoutStyles from "../../../page.module.css";
import styles from "../../professor/enviar/page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function EnviarMensagemCoordenadorPage() {
  const router = useRouter();
  const params = useParams();
  const alunoId = params.alunoId;

  const [loading, setLoading] = useState(true);
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
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    if (!conteudo.trim()) { setErro("Escreva uma mensagem."); return; }

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/responsavel/alunos/${alunoId}/mensagem/coordenador/enviar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: conteudo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Não foi possível enviar.");
      router.push(`/responsavel/${alunoId}/mensagem/coordenador/${data.conversa_id}`);
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
        <Link href={`/responsavel/${alunoId}/mensagem`} className={layoutStyles.voltarLink}>← Mensagens</Link>

        <h1 className={layoutStyles.title}>Nova mensagem — Coordenação</h1>

        <form className={styles.card} onSubmit={handleSubmit}>
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