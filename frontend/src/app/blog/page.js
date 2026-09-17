// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import logo from "@/assets/logo.png";
// import styles from "./page.module.css";

// const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

// function formatarData(iso) {
//   const data = new Date(iso);
//   return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
// }

// const TIPO_LABEL = { ALUNO: "Aluno", PROFESSOR: "Professor", RESPONSAVEL: "Responsável", COORDENADOR: "Coordenador" };

// export default function BlogPage() {
//   const [posts, setPosts] = useState([]);
//   const [carregando, setCarregando] = useState(true);
//   const [usuario, setUsuario] = useState(null);

//   useEffect(() => {
//     async function init() {
//       try {
//         const authRes = await fetch(`${API_BASE}/api/blog/auth`, { credentials: "include" });
//         const authData = await authRes.json();
//         setUsuario(authData.return ? authData.usuario : null);

//         const res = await fetch(`${API_BASE}/api/blog/posts`, { credentials: "include" });
//         const data = await res.json();
//         setPosts(data.posts || []);
//       } finally {
//         setCarregando(false);
//       }
//     }
//     init();
//   }, []);

//   async function handleCurtir(postId) {
//     if (!usuario) return;

//     // Atualização otimista: reflete na tela antes da resposta do servidor.
//     setPosts((prev) =>
//       prev.map((p) =>
//         p.id === postId
//           ? {
//             ...p,
//             curtido_por_mim: !p.curtido_por_mim,
//             total_curtidas: p.curtido_por_mim ? p.total_curtidas - 1 : p.total_curtidas + 1,
//           }
//           : p
//       )
//     );

//     try {
//       await fetch(`${API_BASE}/api/blog/posts/${postId}/curtir`, { method: "POST", credentials: "include" });
//     } catch (error) {
//       // Se falhar, recarrega a lista pra corrigir o estado otimista.
//       const res = await fetch(`${API_BASE}/api/blog/posts`, { credentials: "include" });
//       const data = await res.json();
//       setPosts(data.posts || []);
//     }
//   }

//   return (
//     <div className={styles.page}>
//       <header className={styles.topbar}>
//         <div className={styles.topbarInner}>
//           <div className={styles.brand}>
//             <Image src={logo} alt="Logo do SIAA" className={styles.brandLogo} priority />
//             <span className={styles.brandText}>Blog SIAA</span>
//           </div>

//           {usuario ? (
//             <div className={styles.userArea}>
//               <span className={styles.userNome}>{usuario.nome_completo}</span>
//               <Link href="/blog/novo" className={styles.botaoNovoPost}>
//                 + Novo post
//               </Link>
//             </div>
//           ) : (
//             <Link href="/blog/login" className={styles.botaoEntrar}>
//               Entrar
//             </Link>
//           )}
//         </div>
//       </header>

//       <main className={styles.feed}>
//         {carregando ? (
//           <p className={styles.vazio}>Carregando publicações…</p>
//         ) : posts.length === 0 ? (
//           <p className={styles.vazio}>Nenhuma publicação ainda.</p>
//         ) : (
//           posts.map((post) => (
//             <article key={post.id} className={styles.postCard}>
//               <div className={styles.postHeader}>
//                 <span className={styles.avatarIniciais}>
//                   {post.autor_nome?.trim().charAt(0) || "?"}
//                 </span>
//                 <div className={styles.postHeaderTextos}>
//                   <span className={styles.postAutor}>{post.autor_nome}</span>
//                   <span className={styles.postMeta}>
//                     {TIPO_LABEL[post.autor_tipo] || post.autor_tipo} · {formatarData(post.data_criacao)} · {post.tempo_leitura} min de leitura
//                   </span>
//                 </div>
//               </div>

//               <Link href={`/blog/${post.id}`} className={styles.postLink}>
//                 {post.imagem_url && (
//                   <img src={`${API_BASE}${post.imagem_url}`} alt={post.titulo} className={styles.postImagem} />
//                 )}
//                 <h2 className={styles.postTitulo}>{post.titulo}</h2>
//                 <p className={styles.postResumo}>{post.resumo}</p>
//               </Link>

//               <div className={styles.postAcoes}>
//                 {/* ...continua igual... */}
//                 <button
//                   className={`${styles.acaoBotao} ${post.curtido_por_mim ? styles.acaoBotaoAtivo : ""}`}
//                   onClick={() => handleCurtir(post.id)}
//                   disabled={!usuario}
//                   title={usuario ? "Curtir" : "Entre para curtir"}
//                 >
//                   <svg width="17" height="17" viewBox="0 0 24 24" fill={post.curtido_por_mim ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
//                   </svg>
//                   {post.total_curtidas}
//                 </button>

//                 <Link href={`/blog/${post.id}`} className={styles.acaoBotao}>
//                   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <path d="M8 9h8" />
//                     <path d="M8 13h6" />
//                     <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
//                   </svg>
//                   {post.total_comentarios}
//                 </Link>
//               </div>
//             </article>
//           ))
//         )}
//       </main>
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

const TIPO_LABEL = { ALUNO: "Aluno", PROFESSOR: "Professor", RESPONSAVEL: "Responsável", COORDENADOR: "Coordenador" };
const TIPO_COR = {
  ALUNO: styles.badgeAluno,
  PROFESSOR: styles.badgeProfessor,
  RESPONSAVEL: styles.badgeResponsavel,
  COORDENADOR: styles.badgeCoordenador,
};

function formatarData(iso) {
  const data = new Date(iso);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/blog/auth`, { credentials: "include" });
        const authData = await authRes.json();
        setUsuario(authData.return ? authData.usuario : null);

        const res = await fetch(`${API_BASE}/api/blog/posts`, { credentials: "include" });
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
      await fetch(`${API_BASE}/api/blog/posts/${postId}/curtir`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      const res = await fetch(`${API_BASE}/api/blog/posts`, { credentials: "include" });
      const data = await res.json();
      setPosts(data.posts || []);
    }
  }

  const maisCurtidos = [...posts]
    .sort((a, b) => b.total_curtidas - a.total_curtidas)
    .slice(0, 5)
    .filter((p) => p.total_curtidas > 0);

  const totalCurtidas = posts.reduce((soma, p) => soma + p.total_curtidas, 0);
  const totalComentarios = posts.reduce((soma, p) => soma + p.total_comentarios, 0);

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
              <span className={styles.avatarIniciaisTopbar}>
                {usuario.nome_completo?.trim().charAt(0) || "?"}
              </span>
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

      <div className={styles.corpo}>
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
                    <div className={styles.postAutorLinha}>
                      <span className={styles.postAutor}>{post.autor_nome}</span>
                      <span className={`${styles.badge} ${TIPO_COR[post.autor_tipo] || ""}`}>
                        {TIPO_LABEL[post.autor_tipo] || post.autor_tipo}
                      </span>
                    </div>
                    <span className={styles.postMeta}>
                      {formatarData(post.data_criacao)} · {post.tempo_leitura} min de leitura
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
            ))
          )}
        </main>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitulo}>Comunidade</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statValor}>{posts.length}</span>
                <span className={styles.statLabel}>Posts</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValor}>{totalCurtidas}</span>
                <span className={styles.statLabel}>Curtidas</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValor}>{totalComentarios}</span>
                <span className={styles.statLabel}>Comentários</span>
              </div>
            </div>
          </div>

          {maisCurtidos.length > 0 && (
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitulo}>Mais curtidos</h3>
              <ul className={styles.rankingLista}>
                {maisCurtidos.map((post, i) => (
                  <li key={post.id}>
                    <Link href={`/blog/${post.id}`} className={styles.rankingItem}>
                      <span className={styles.rankingPosicao}>{i + 1}</span>
                      <div className={styles.rankingTextos}>
                        <span className={styles.rankingTitulo}>{post.titulo}</span>
                        <span className={styles.rankingMeta}>{post.autor_nome} · {post.total_curtidas} curtidas</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}