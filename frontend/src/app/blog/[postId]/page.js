"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

const API_BASE = "https://humble-spoon-4j654556jr9vf5qp6-8000.app.github.dev";

function formatarData(dataISO) {
  const data = new Date(dataISO);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function PostDetalhePage() {
  const { postId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);
  const [blogger, setBlogger] = useState(null);
  const [erros, setErros] = useState([]);
  const [confirmando, setConfirmando] = useState(false);
  const [deletando, setDeletando] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [postRes, authRes] = await Promise.all([
          fetch(`${API_BASE}/api/blog/posts/${postId}`),
          fetch(`${API_BASE}/api/blog/auth`),
        ]);

        if (!postRes.ok) throw new Error(`Falha ao buscar post (status ${postRes.status})`);
        const postData = await postRes.json();
        setPost(postData.post);

        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.return) setBlogger(authData.blogger);
        }
      } catch (error) {
        setErros([`Erro ao carregar post: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [postId]);

  async function handleDeletar() {
    setDeletando(true);
    try {
      const res = await fetch(`${API_BASE}/api/blog/posts/${postId}/deletar`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const corpoErro = await res.text();
        let msg = `Falha ao apagar (status ${res.status})`;
        try {
          const json = JSON.parse(corpoErro);
          if (json.message) msg = json.message;
        } catch {}
        throw new Error(msg);
      }

      router.push("/blog");
    } catch (error) {
      setErros([`Erro ao apagar post: ${error.message}`]);
      setDeletando(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.wrapper}>
          <p className={styles.subtitle}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.page}>
        <div className={styles.wrapper}>
          {erros.length > 0 && (
            <ul className={styles.listaErros}>
              {erros.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  const ehAutor = blogger && blogger.id === post.autor_id;

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <Link href="/blog" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Blog
        </Link>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        <article className={styles.post}>
          <div className={styles.postMeta}>
            <span>{post.autor}</span>
            <span>·</span>
            <span>{formatarData(post.data_criacao)}</span>
            <span>·</span>
            <span>{post.tempo_leitura} min de leitura</span>
          </div>

          <h1 className={styles.postTitulo}>{post.titulo}</h1>

          {ehAutor && (
            <div className={styles.acoesAutor}>
              <Link href={`/blog/${postId}/editar`} className={styles.editarBotao}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
                  <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
                </svg>
                Editar
              </Link>

              {!confirmando ? (
                <button className={styles.apagarBotao} onClick={() => setConfirmando(true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7l16 0" />
                    <path d="M10 11l0 6" />
                    <path d="M14 11l0 6" />
                    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                  </svg>
                  Apagar
                </button>
              ) : (
                <div className={styles.confirmacaoWrapper}>
                  <span>Apagar post?</span>
                  <button className={styles.confirmarBotao} onClick={handleDeletar} disabled={deletando}>
                    {deletando ? "..." : "Sim"}
                  </button>
                  <button className={styles.cancelarBotao} onClick={() => setConfirmando(false)} disabled={deletando}>
                    Não
                  </button>
                </div>
              )}
            </div>
          )}

          <div className={styles.postConteudo}>
            {post.conteudo.split("\n").map((paragrafo, i) => (
              paragrafo.trim() ? <p key={i}>{paragrafo}</p> : <br key={i} />
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}