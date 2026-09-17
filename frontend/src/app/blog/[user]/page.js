"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";
const TIPO_LABEL = { ALUNO: "Aluno", PROFESSOR: "Professor", RESPONSAVEL: "Responsável", COORDENADOR: "Coordenador" };

function formatarData(iso) {
  if (!iso) return null;
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function PerfilBlogPage() {
  const { user } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [estatisticas, setEstatisticas] = useState(null);
  const [posts, setPosts] = useState([]);
  const [logadoComoUsuario, setLogadoComoUsuario] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const [authRes, perfilRes] = await Promise.all([
          fetch(`${API_BASE}/api/blog/auth`, { credentials: "include" }),
          fetch(`${API_BASE}/api/blog/perfil/${user}`, { credentials: "include" }),
        ]);

        const authData = await authRes.json();
        setLogadoComoUsuario(authData.return ? authData.usuario : null);

        if (!perfilRes.ok) throw new Error("Perfil não encontrado.");
        const data = await perfilRes.json();
        setPerfil(data.perfil);
        setEstatisticas(data.estatisticas);
        setPosts(data.posts || []);
      } catch (error) {
        setErro(error.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.vazio}>Carregando perfil...</p>
      </div>
    );
  }

  if (erro || !perfil) {
    return (
      <div className={styles.page}>
        <div className={styles.wrapper}>
          <p className={styles.erro}>{erro || "Perfil não encontrado."}</p>
          <Link href="/blog" className={styles.voltarLink}>← Voltar ao blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link href="/blog" className={styles.brand}>
            <Image src={logo} alt="Logo do SIAA" className={styles.brandLogo} priority />
            <span className={styles.brandText}>Blog SIAA</span>
          </Link>
          {logadoComoUsuario && (
            <Link href={`/blog/${logadoComoUsuario.nome_usuario}`} className={styles.meuPerfilBotao}>
              Meu perfil
            </Link>
          )}
        </div>
      </header>

      <div className={styles.wrapper}>
        <div className={styles.perfilCard}>
          <div className={styles.perfilTopo}>
            {perfil.foto_perfil_url ? (
              <img
                src={`${API_BASE}${perfil.foto_perfil_url}`}
                alt={perfil.nome_completo}
                className={styles.avatarFoto}
              />
            ) : (
              <div className={styles.avatarIniciais}>
                {perfil.nome_completo?.trim().charAt(0) || "?"}
              </div>
            )}

            <div className={styles.perfilInfo}>
              <div className={styles.nomeLinha}>
                <h1 className={styles.nomeCompleto}>{perfil.nome_completo}</h1>
                <span className={styles.badge}>{TIPO_LABEL[perfil.tipo] || perfil.tipo}</span>
              </div>
              <p className={styles.username}>@{perfil.nome_usuario}</p>

              {perfil.bio && <p className={styles.bio}>{perfil.bio}</p>}

              <div className={styles.detalhesLista}>
                {perfil.data_nascimento && (
                  <span className={styles.detalheItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
                      <path d="M16 3v4M8 3v4M4 11h16" />
                    </svg>
                    {formatarData(perfil.data_nascimento)}
                  </span>
                )}
                {perfil.status_relacionamento_label && (
                  <span className={styles.detalheItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
                    </svg>
                    {perfil.status_relacionamento_label}
                  </span>
                )}
              </div>
            </div>

            {perfil.eh_proprio_perfil && (
              <Link href={`/blog/${perfil.nome_usuario}/editar`} className={styles.editarBotao}>
                Editar perfil
              </Link>
            )}
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statValor}>{estatisticas.total_posts}</span>
              <span className={styles.statLabel}>Posts</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValor}>{estatisticas.total_curtidas_recebidas}</span>
              <span className={styles.statLabel}>Curtidas recebidas</span>
            </div>
          </div>
        </div>

        <h2 className={styles.postsTitulo}>Publicações</h2>

        {posts.length === 0 ? (
          <p className={styles.vazio}>Nenhuma publicação ainda.</p>
        ) : (
          <div className={styles.postsGrid}>
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/post/${post.id}`} className={styles.postCard}>
                {post.imagem_url && (
                  <img src={`${API_BASE}${post.imagem_url}`} alt={post.titulo} className={styles.postImagem} />
                )}
                <div className={styles.postCardBody}>
                  <h3 className={styles.postTitulo}>{post.titulo}</h3>
                  <p className={styles.postResumo}>{post.resumo}</p>
                  <div className={styles.postMeta}>
                    <span>{post.total_curtidas} curtidas</span>
                    <span>{post.total_comentarios} comentários</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}