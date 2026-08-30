"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_BASE = "https://humble-spoon-4j654556jr9vf5qp6-8000.app.github.dev";

export default function NovoPostPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [erros, setErros] = useState([]);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`${API_BASE}/api/blog/auth`);
        const data = await res.json();
        if (!data.return) {
          router.push("/blog/login");
          return;
        }
      } catch (error) {
        router.push("/blog/login");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  const palavras = conteudo.trim() ? conteudo.trim().split(/\s+/).length : 0;
  const tempoEstimado = Math.max(Math.ceil(palavras / 200), 1);

  async function handleSalvar(e) {
    e.preventDefault();
    setSaving(true);
    setErros([]);
    setMensagem(null);

    if (!titulo.trim() || !conteudo.trim()) {
      setErros(["Título e conteúdo são obrigatórios."]);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/blog/posts/criar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: titulo.trim(), conteudo: conteudo.trim() }),
      });

      if (!res.ok) {
        const corpoErro = await res.text();
        let msg = `Falha ao publicar (status ${res.status})`;
        try {
          const json = JSON.parse(corpoErro);
          if (json.message) msg = json.message;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json();
      setMensagem("Post publicado com sucesso.");
      setTimeout(() => {
        router.push(`/blog/${data.post.id}`);
      }, 700);
    } catch (error) {
      setErros([`Erro ao publicar post: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Novo post</h1>
            <p className={styles.subtitle}>Escreva uma novidade para o blog do SIAA.</p>
          </div>
          <button type="button" className={styles.voltarBotao} onClick={() => router.push("/blog")}>
            Voltar
          </button>
        </div>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        {mensagem && <p className={styles.mensagemSucesso}>{mensagem}</p>}

        <form className={styles.form} onSubmit={handleSalvar}>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="titulo">
              Título <span className={styles.obrigatorio}>*</span>
            </label>
            <input
              id="titulo"
              type="text"
              className={styles.input}
              placeholder="Título do post"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          <div className={styles.campo}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor="conteudo">
                Conteúdo <span className={styles.obrigatorio}>*</span>
              </label>
              <span className={styles.tempoEstimado}>~{tempoEstimado} min de leitura</span>
            </div>
            <textarea
              id="conteudo"
              className={styles.textarea}
              placeholder="Escreva o conteúdo do post..."
              rows={14}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.botaoSalvar} disabled={saving}>
            {saving ? "Publicando..." : "Publicar post"}
          </button>
        </form>
      </div>
    </div>
  );
}