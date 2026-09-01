"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function EditarPostPage() {
  const { postId } = useParams();
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
        const authRes = await fetch(`${API_BASE}/api/blog/auth`);
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/blog/login");
          return;
        }

        const postRes = await fetch(`${API_BASE}/api/blog/posts/${postId}`);
        if (!postRes.ok) throw new Error(`Falha ao buscar post (status ${postRes.status})`);
        const postData = await postRes.json();

        if (postData.post.autor_id !== authData.blogger.id) {
          setErros(["Você não tem permissão para editar este post."]);
          setLoading(false);
          return;
        }

        setTitulo(postData.post.titulo);
        setConteudo(postData.post.conteudo);
      } catch (error) {
        setErros([`Erro ao carregar post: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [postId, router]);

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
      const res = await fetch(`${API_BASE}/api/blog/posts/${postId}/editar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: titulo.trim(), conteudo: conteudo.trim() }),
      });

      if (!res.ok) {
        const corpoErro = await res.text();
        let msg = `Falha ao salvar (status ${res.status})`;
        try {
          const json = JSON.parse(corpoErro);
          if (json.message) msg = json.message;
        } catch {}
        throw new Error(msg);
      }

      setMensagem("Post atualizado com sucesso.");
      setTimeout(() => {
        router.push(`/blog/${postId}`);
      }, 700);
    } catch (error) {
      setErros([`Erro ao salvar alterações: ${error.message}`]);
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
            <h1 className={styles.title}>Editar post</h1>
            <p className={styles.subtitle}>Atualize o conteúdo do post.</p>
          </div>
          <button type="button" className={styles.voltarBotao} onClick={() => router.push(`/blog/${postId}`)}>
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

        {erros.length === 0 && (
          <form className={styles.form} onSubmit={handleSalvar}>
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="titulo">
                Título <span className={styles.obrigatorio}>*</span>
              </label>
              <input
                id="titulo"
                type="text"
                className={styles.input}
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
                rows={14}
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                required
              />
            </div>

            <button type="submit" className={styles.botaoSalvar} disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}