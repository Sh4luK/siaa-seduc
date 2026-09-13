// "use client";

// import Link from "next/link";
// import { useEffect, useState } from "react";
// import styles from "./page.module.css";

// const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

// function formatarData(dataISO) {
//   const data = new Date(dataISO);
//   return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
// }

// export default function BlogPage() {
//   const [loading, setLoading] = useState(true);
//   const [posts, setPosts] = useState([]);
//   const [erros, setErros] = useState([]);
//   const [blogger, setBlogger] = useState(null);

//   useEffect(() => {
//     async function init() {
//       try {
//         const [postsRes, authRes] = await Promise.all([
//           fetch(`${API_BASE}/api/blog/posts`),
//           fetch(`${API_BASE}/api/blog/auth`),
//         ]);

//         if (!postsRes.ok) throw new Error(`Falha ao buscar posts (status ${postsRes.status})`);
//         const postsData = await postsRes.json();
//         setPosts(postsData.posts || []);

//         if (authRes.ok) {
//           const authData = await authRes.json();
//           if (authData.return) setBlogger(authData.blogger);
//         }
//       } catch (error) {
//         setErros([`Erro ao carregar posts: ${error.message}`]);
//       } finally {
//         setLoading(false);
//       }
//     }

//     init();
//   }, []);

//   return (
//     <div className={styles.page}>
//       <div className={styles.wrapper}>
//         <header className={styles.headerRow}>
//           <div>
//             <p className={styles.eyebrow}>SIAA Blog</p>
//             <h1 className={styles.title}>Notícias e novidades</h1>
//             <p className={styles.subtitle}>
//               Acompanhe as atualizações e comunicados sobre o sistema.
//             </p>
//           </div>

//           {blogger ? (
//             <Link href="/blog/novo" className={styles.novoBotao}>
//               + Novo post
//             </Link>
//           ) : (
//             <Link href="/blog/login" className={styles.loginLink}>
//               Área do blogger
//             </Link>
//           )}
//         </header>

//         {erros.length > 0 && (
//           <ul className={styles.listaErros}>
//             {erros.map((e, i) => (
//               <li key={i}>{e}</li>
//             ))}
//           </ul>
//         )}

//         {loading ? (
//           <p className={styles.subtitle}>Carregando posts...</p>
//         ) : posts.length === 0 ? (
//           <p className={styles.vazio}>Nenhum post publicado ainda.</p>
//         ) : (
//           <div className={styles.postsGrid}>
//             {posts.map((post) => (
//               <Link key={post.id} href={`/blog/${post.id}`} className={styles.postCard}>
//                 <p className={styles.postTitulo}>{post.titulo}</p>
//                 <p className={styles.postResumo}>{post.resumo}</p>
//                 <div className={styles.postRodape}>
//                   <span>{post.autor}</span>
//                   <span>·</span>
//                   <span>{formatarData(post.data_criacao)}</span>
//                   <span>·</span>
//                   <span>{post.tempo_leitura} min de leitura</span>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function formatarData(iso) {
  const data = new Date(iso);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

const TIPO_LABEL = { ALUNO: "Aluno", PROFESSOR: "Professor", RESPONSAVEL: "Responsável", COORDENADOR: "Coordenador" };

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/blog/auth`);
        const authData = await authRes.json();
        setUsuario(authData.return ? authData.usuario : null);

        const res = await fetch(`${API_BASE}/api/blog/posts`);
        const data = await res.json();
        setPosts(data.posts || []);
      } finally {
        setCarregando(false);
      }
    }
    init();
  }, []);

  async function handleCurtir(postId) {
    if (!usuario) return;

    // Atualização otimista: reflete na tela antes da resposta do servidor.
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
            ...p,
            curtido_por_mim: !p.curtido_por_mim,
            total_curtidas: p.curtido_por_mim ? p.total_curtidas - 1 : p.total_curtidas + 1,
          }
          : p
      )
    );

    try {
      await fetch(`${API_BASE}/api/blog/posts/${postId}/curtir`, { method: "POST" });
    } catch (error) {
      // Se falhar, recarrega a lista pra corrigir o estado otimista.
      const res = await fetch(`${API_BASE}/api/blog/posts`);
      const data = await res.json();
      setPosts(data.posts || []);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.brand}>
            <Image src={logo} alt="Logo do SIAA" className={styles.brandLogo} priority />
            <span className={styles.brandText}>Blog SIAA</span>
          </div>

          {usuario ? (
            <div className={styles.userArea}>
              <span className={styles.userNome}>{usuario.nome_completo}</span>
              <Link href="/blog/novo" className={styles.botaoNovoPost}>
                + Novo post
              </Link>
            </div>
          ) : (
            <Link href="/blog/login" className={styles.botaoEntrar}>
              Entrar
            </Link>
          )}
        </div>
      </header>

      <main className={styles.feed}>
        {carregando ? (
          <p className={styles.vazio}>Carregando publicações…</p>
        ) : posts.length === 0 ? (
          <p className={styles.vazio}>Nenhuma publicação ainda.</p>
        ) : (
          posts.map((post) => (
            <article key={post.id} className={styles.postCard}>
              <div className={styles.postHeader}>
                <span className={styles.avatarIniciais}>
                  {post.autor_nome?.trim().charAt(0) || "?"}
                </span>
                <div className={styles.postHeaderTextos}>
                  <span className={styles.postAutor}>{post.autor_nome}</span>
                  <span className={styles.postMeta}>
                    {TIPO_LABEL[post.autor_tipo] || post.autor_tipo} · {formatarData(post.data_criacao)} · {post.tempo_leitura} min de leitura
                  </span>
                </div>
              </div>

              <Link href={`/blog/${post.id}`} className={styles.postLink}>
                {post.imagem_url && (
                  <img src={`${API_BASE}${post.imagem_url}`} alt={post.titulo} className={styles.postImagem} />
                )}
                <h2 className={styles.postTitulo}>{post.titulo}</h2>
                <p className={styles.postResumo}>{post.resumo}</p>
              </Link>

              <div className={styles.postAcoes}>
                {/* ...continua igual... */}
                <button
                  className={`${styles.acaoBotao} ${post.curtido_por_mim ? styles.acaoBotaoAtivo : ""}`}
                  onClick={() => handleCurtir(post.id)}
                  disabled={!usuario}
                  title={usuario ? "Curtir" : "Entre para curtir"}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill={post.curtido_por_mim ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
                  </svg>
                  {post.total_curtidas}
                </button>

                <Link href={`/blog/${post.id}`} className={styles.acaoBotao}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 9h8" />
                    <path d="M8 13h6" />
                    <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
                  </svg>
                  {post.total_comentarios}
                </Link>
              </div>
            </article>
            // <article key={post.id} className={styles.postCard}>
            //   <div className={styles.postHeader}>
            //     <span className={styles.avatarIniciais}>
            //       {post.autor_nome?.trim().charAt(0) || "?"}
            //     </span>
            //     <div className={styles.postHeaderTextos}>
            //       <span className={styles.postAutor}>{post.autor_nome}</span>
            //       <span className={styles.postMeta}>
            //         {TIPO_LABEL[post.autor_tipo] || post.autor_tipo} · {formatarData(post.data_criacao)} · {post.tempo_leitura} min de leitura
            //       </span>
            //     </div>
            //   </div>

            //   <Link href={`/blog/${post.id}`} className={styles.postLink}>
            //     <h2 className={styles.postTitulo}>{post.titulo}</h2>
            //     <p className={styles.postResumo}>{post.resumo}</p>
            //   </Link>

            //   <div className={styles.postAcoes}>
                // <button
                //   className={`${styles.acaoBotao} ${post.curtido_por_mim ? styles.acaoBotaoAtivo : ""}`}
                //   onClick={() => handleCurtir(post.id)}
                //   disabled={!usuario}
                //   title={usuario ? "Curtir" : "Entre para curtir"}
                // >
                //   <svg width="17" height="17" viewBox="0 0 24 24" fill={post.curtido_por_mim ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                //     <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
                //   </svg>
                //   {post.total_curtidas}
                // </button>

                // <Link href={`/blog/${post.id}`} className={styles.acaoBotao}>
                //   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                //     <path d="M8 9h8" />
                //     <path d="M8 13h6" />
                //     <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
                //   </svg>
                //   {post.total_comentarios}
                // </Link>
            //   </div>
            // </article>

          ))
        )}
      </main>
    </div>
  );
}