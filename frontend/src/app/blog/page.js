"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function formatarData(dataISO) {
  const data = new Date(dataISO);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function BlogPage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [erros, setErros] = useState([]);
  const [blogger, setBlogger] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const [postsRes, authRes] = await Promise.all([
          fetch(`${API_BASE}/api/blog/posts`),
          fetch(`${API_BASE}/api/blog/auth`),
        ]);

        if (!postsRes.ok) throw new Error(`Falha ao buscar posts (status ${postsRes.status})`);
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);

        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.return) setBlogger(authData.blogger);
        }
      } catch (error) {
        setErros([`Erro ao carregar posts: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <header className={styles.headerRow}>
          <div>
            <p className={styles.eyebrow}>SIAA Blog</p>
            <h1 className={styles.title}>Notícias e novidades</h1>
            <p className={styles.subtitle}>
              Acompanhe as atualizações e comunicados sobre o sistema.
            </p>
          </div>

          {blogger ? (
            <Link href="/blog/novo" className={styles.novoBotao}>
              + Novo post
            </Link>
          ) : (
            <Link href="/blog/login" className={styles.loginLink}>
              Área do blogger
            </Link>
          )}
        </header>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        {loading ? (
          <p className={styles.subtitle}>Carregando posts...</p>
        ) : posts.length === 0 ? (
          <p className={styles.vazio}>Nenhum post publicado ainda.</p>
        ) : (
          <div className={styles.postsGrid}>
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`} className={styles.postCard}>
                <p className={styles.postTitulo}>{post.titulo}</p>
                <p className={styles.postResumo}>{post.resumo}</p>
                <div className={styles.postRodape}>
                  <span>{post.autor}</span>
                  <span>·</span>
                  <span>{formatarData(post.data_criacao)}</span>
                  <span>·</span>
                  <span>{post.tempo_leitura} min de leitura</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}