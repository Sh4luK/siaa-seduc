// "use client";

// import Link from "next/link";
// import { useParams, useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import styles from "./page.module.css";

// const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

// function formatarData(dataISO) {
//   const data = new Date(dataISO);
//   return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
// }

// export default function PostDetalhePage() {
//   const { postId } = useParams();
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [post, setPost] = useState(null);
//   const [blogger, setBlogger] = useState(null);
//   const [erros, setErros] = useState([]);
//   const [confirmando, setConfirmando] = useState(false);
//   const [deletando, setDeletando] = useState(false);

//   useEffect(() => {
//     async function init() {
//       try {
//         const [postRes, authRes] = await Promise.all([
//           fetch(`${API_BASE}/api/blog/posts/${postId}`),
//           fetch(`${API_BASE}/api/blog/auth`),
//         ]);

//         if (!postRes.ok) throw new Error(`Falha ao buscar post (status ${postRes.status})`);
//         const postData = await postRes.json();
//         setPost(postData.post);

//         if (authRes.ok) {
//           const authData = await authRes.json();
//           if (authData.return) setBlogger(authData.blogger);
//         }
//       } catch (error) {
//         setErros([`Erro ao carregar post: ${error.message}`]);
//       } finally {
//         setLoading(false);
//       }
//     }

//     init();
//   }, [postId]);

//   async function handleDeletar() {
//     setDeletando(true);
//     try {
//       const res = await fetch(`${API_BASE}/api/blog/posts/${postId}/deletar`, {
//         method: "DELETE",
//       });
//       if (!res.ok) {
//         const corpoErro = await res.text();
//         let msg = `Falha ao apagar (status ${res.status})`;
//         try {
//           const json = JSON.parse(corpoErro);
//           if (json.message) msg = json.message;
//         } catch {}
//         throw new Error(msg);
//       }

//       router.push("/blog");
//     } catch (error) {
//       setErros([`Erro ao apagar post: ${error.message}`]);
//       setDeletando(false);
//     }
//   }

//   if (loading) {
//     return (
//       <div className={styles.page}>
//         <div className={styles.wrapper}>
//           <p className={styles.subtitle}>Carregando...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!post) {
//     return (
//       <div className={styles.page}>
//         <div className={styles.wrapper}>
//           {erros.length > 0 && (
//             <ul className={styles.listaErros}>
//               {erros.map((e, i) => (
//                 <li key={i}>{e}</li>
//               ))}
//             </ul>
//           )}
//         </div>
//       </div>
//     );
//   }

//   const ehAutor = blogger && blogger.id === post.autor_id;

//   return (
//     <div className={styles.page}>
//       <div className={styles.wrapper}>
//         <Link href="/blog" className={styles.voltarLink}>
//           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M15 6l-6 6l6 6" />
//           </svg>
//           Blog
//         </Link>

//         {erros.length > 0 && (
//           <ul className={styles.listaErros}>
//             {erros.map((e, i) => (
//               <li key={i}>{e}</li>
//             ))}
//           </ul>
//         )}

//         <article className={styles.post}>
//           <div className={styles.postMeta}>
//             <span>{post.autor}</span>
//             <span>·</span>
//             <span>{formatarData(post.data_criacao)}</span>
//             <span>·</span>
//             <span>{post.tempo_leitura} min de leitura</span>
//           </div>

//           <h1 className={styles.postTitulo}>{post.titulo}</h1>

//           {ehAutor && (
//             <div className={styles.acoesAutor}>
//               <Link href={`/blog/${postId}/editar`} className={styles.editarBotao}>
//                 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
//                   <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
//                 </svg>
//                 Editar
//               </Link>

//               {!confirmando ? (
//                 <button className={styles.apagarBotao} onClick={() => setConfirmando(true)}>
//                   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <path d="M4 7l16 0" />
//                     <path d="M10 11l0 6" />
//                     <path d="M14 11l0 6" />
//                     <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
//                     <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
//                   </svg>
//                   Apagar
//                 </button>
//               ) : (
//                 <div className={styles.confirmacaoWrapper}>
//                   <span>Apagar post?</span>
//                   <button className={styles.confirmarBotao} onClick={handleDeletar} disabled={deletando}>
//                     {deletando ? "..." : "Sim"}
//                   </button>
//                   <button className={styles.cancelarBotao} onClick={() => setConfirmando(false)} disabled={deletando}>
//                     Não
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}

//           <div className={styles.postConteudo}>
//             {post.conteudo.split("\n").map((paragrafo, i) => (
//               paragrafo.trim() ? <p key={i}>{paragrafo}</p> : <br key={i} />
//             ))}
//           </div>
//         </article>
//       </div>
//     </div>
//   );
// }


"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

const TIPO_LABEL = { ALUNO: "Aluno", PROFESSOR: "Professor", RESPONSAVEL: "Responsável", COORDENADOR: "Coordenador" };

function formatarData(dataISO) {
  const data = new Date(dataISO);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function PostDetalhePage() {
  const { postId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [erros, setErros] = useState([]);
  const [confirmando, setConfirmando] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [novoComentario, setNovoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [curtindo, setCurtindo] = useState(false);

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
        setComentarios(postData.comentarios || []);

        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.return) setUsuario(authData.usuario);
        }
      } catch (error) {
        setErros([`Erro ao carregar post: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [postId]);

  async function handleCurtir() {
    if (!usuario || curtindo) return;
    setCurtindo(true);

    // Atualização otimista.
    setPost((prev) => ({
      ...prev,
      curtido_por_mim: !prev.curtido_por_mim,
      total_curtidas: prev.curtido_por_mim ? prev.total_curtidas - 1 : prev.total_curtidas + 1,
    }));

    try {
      const res = await fetch(`${API_BASE}/api/blog/posts/${postId}/curtir`, { method: "POST" });
      const data = await res.json();
      setPost((prev) => ({ ...prev, curtido_por_mim: data.curtido, total_curtidas: data.total_curtidas }));
    } catch (error) {
      // reverte em caso de falha
      setPost((prev) => ({
        ...prev,
        curtido_por_mim: !prev.curtido_por_mim,
        total_curtidas: prev.curtido_por_mim ? prev.total_curtidas - 1 : prev.total_curtidas + 1,
      }));
    } finally {
      setCurtindo(false);
    }
  }

  async function handleComentar(e) {
    e.preventDefault();
    if (!novoComentario.trim() || enviandoComentario) return;

    setEnviandoComentario(true);
    try {
      const res = await fetch(`${API_BASE}/api/blog/posts/${postId}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: novoComentario.trim() }),
      });
      if (!res.ok) throw new Error("Falha ao enviar comentário.");
      const data = await res.json();
      setComentarios((prev) => [...prev, data]);
      setNovoComentario("");
    } catch (error) {
      setErros([error.message]);
    } finally {
      setEnviandoComentario(false);
    }
  }

  async function handleApagarComentario(comentarioId) {
    try {
      await fetch(`${API_BASE}/api/blog/comentarios/${comentarioId}`, { method: "DELETE" });
      setComentarios((prev) => prev.filter((c) => c.id !== comentarioId));
    } catch (error) {
      setErros(["Erro ao apagar comentário."]);
    }
  }

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

  const ehAutor = usuario && usuario.tipo === post.autor_tipo && usuario.referencia_id === post.autor_id;

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
          <div className={styles.autorLinha}>
            <span className={styles.avatarIniciais}>
              {post.autor_nome?.trim().charAt(0) || "?"}
            </span>
            <div className={styles.autorTextos}>
              <span className={styles.autorNome}>{post.autor_nome}</span>
              <span className={styles.postMeta}>
                {TIPO_LABEL[post.autor_tipo] || post.autor_tipo} · {formatarData(post.data_criacao)} · {post.tempo_leitura} min de leitura
              </span>
            </div>
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

          <div className={styles.postAcoes}>
            <button
              className={`${styles.acaoBotao} ${post.curtido_por_mim ? styles.acaoBotaoAtivo : ""}`}
              onClick={handleCurtir}
              disabled={!usuario || curtindo}
              title={usuario ? "Curtir" : "Entre para curtir"}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill={post.curtido_por_mim ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
              </svg>
              {post.total_curtidas} {post.total_curtidas === 1 ? "curtida" : "curtidas"}
            </button>

            <span className={styles.acaoBotao}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 9h8" />
                <path d="M8 13h6" />
                <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
              </svg>
              {comentarios.length} {comentarios.length === 1 ? "comentário" : "comentários"}
            </span>
          </div>
        </article>

        <section className={styles.comentariosSecao}>
          <h2 className={styles.comentariosTitulo}>Comentários</h2>

          {usuario ? (
            <form onSubmit={handleComentar} className={styles.comentarioForm}>
              <textarea
                className={styles.comentarioInput}
                placeholder="Escreva um comentário..."
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                rows={2}
              />
              <button type="submit" className={styles.comentarioBotao} disabled={enviandoComentario || !novoComentario.trim()}>
                {enviandoComentario ? "Enviando..." : "Comentar"}
              </button>
            </form>
          ) : (
            <p className={styles.comentarioLoginAviso}>
              <Link href="/blog/login">Entre</Link> para deixar um comentário.
            </p>
          )}

          {comentarios.length === 0 ? (
            <p className={styles.semComentarios}>Nenhum comentário ainda. Seja o primeiro!</p>
          ) : (
            <ul className={styles.comentariosLista}>
              {comentarios.map((c) => {
                const ehMeuComentario = usuario && usuario.referencia_id === c.autor_id && usuario.tipo === c.autor_tipo;
                return (
                  <li key={c.id} className={styles.comentarioItem}>
                    <span className={styles.avatarIniciaisPequeno}>
                      {c.autor_nome?.trim().charAt(0) || "?"}
                    </span>
                    <div className={styles.comentarioCorpo}>
                      <div className={styles.comentarioHeader}>
                        <span className={styles.comentarioAutor}>{c.autor_nome}</span>
                        <span className={styles.comentarioData}>{formatarData(c.data_criacao)}</span>
                        {ehMeuComentario && (
                          <button className={styles.comentarioApagar} onClick={() => handleApagarComentario(c.id)}>
                            Apagar
                          </button>
                        )}
                      </div>
                      <p className={styles.comentarioTexto}>{c.conteudo}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}