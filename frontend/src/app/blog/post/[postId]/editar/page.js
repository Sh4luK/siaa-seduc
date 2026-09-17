"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import MarkdownEditor from "@/app/components/MarkdownEditor";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function EditarPostPage() {
  const { postId } = useParams();
  const router = useRouter();
  const inputImagemRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [imagemAtualUrl, setImagemAtualUrl] = useState(null);
  const [imagemFile, setImagemFile] = useState(null);
  const [imagemPreview, setImagemPreview] = useState(null);
  const [removerImagem, setRemoverImagem] = useState(false);
  const [erros, setErros] = useState([]);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const [authRes, postRes] = await Promise.all([
          fetch(`${API_BASE}/api/blog/auth`, { credentials: "include" }),
          fetch(`${API_BASE}/api/blog/posts/${postId}`, { credentials: "include" }),
        ]);

        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/blog/login");
          return;
        }

        if (!postRes.ok) throw new Error("Post não encontrado.");
        const postData = await postRes.json();
        const post = postData.post;

        const ehAutor = authData.usuario.tipo === post.autor_tipo && authData.usuario.referencia_id === post.autor_id;
        if (!ehAutor) {
          setErros(["Você não tem permissão para editar este post."]);
          setLoading(false);
          return;
        }

        setTitulo(post.titulo);
        setConteudo(post.conteudo);
        setImagemAtualUrl(post.imagem_url ? `${API_BASE}${post.imagem_url}` : null);
      } catch (error) {
        setErros([error.message]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [postId, router]);

  useEffect(() => {
    return () => {
      if (imagemPreview) URL.revokeObjectURL(imagemPreview);
    };
  }, [imagemPreview]);

  const palavras = conteudo.trim() ? conteudo.trim().split(/\s+/).length : 0;
  const tempoEstimado = Math.max(Math.ceil(palavras / 200), 1);

  function handleSelecionarImagem(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErros(["O arquivo selecionado precisa ser uma imagem."]);
      return;
    }

    if (imagemPreview) URL.revokeObjectURL(imagemPreview);
    setImagemFile(file);
    setImagemPreview(URL.createObjectURL(file));
    setRemoverImagem(false);
    setErros([]);
  }

  function handleRemoverImagem() {
    if (imagemPreview) URL.revokeObjectURL(imagemPreview);
    setImagemFile(null);
    setImagemPreview(null);
    setImagemAtualUrl(null);
    setRemoverImagem(true);
    if (inputImagemRef.current) inputImagemRef.current.value = "";
  }

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
      const formData = new FormData();
      formData.append("titulo", titulo.trim());
      formData.append("conteudo", conteudo.trim());
      if (imagemFile) formData.append("imagem", imagemFile);
      if (removerImagem) formData.append("remover_imagem", "true");

      const res = await fetch(`${API_BASE}/api/blog/posts/${postId}/editar`, {
        credentials: "include",
        method: "POST",
        body: formData,
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
        router.push(`/blog/post/${postId}`);
      }, 700);
    } catch (error) {
      setErros([`Erro ao salvar post: ${error.message}`]);
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
            <p className={styles.subtitle}>Atualize o conteúdo da sua publicação.</p>
          </div>
          <button type="button" className={styles.voltarBotao} onClick={() => router.push(`/blog/post/${postId}`)}>
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

        {erros.length === 0 || titulo ? (
          <form className={styles.form} onSubmit={handleSalvar}>
            <div className={styles.campo}>
              <label className={styles.label}>
                Imagem <span className={styles.opcional}>(opcional)</span>
              </label>

              {imagemPreview || imagemAtualUrl ? (
                <div className={styles.previewWrapper}>
                  <img
                    src={imagemPreview || imagemAtualUrl}
                    alt="Pré-visualização da imagem"
                    className={styles.previewImagem}
                  />
                  <button type="button" className={styles.removerImagemBotao} onClick={handleRemoverImagem}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6l-12 12" />
                      <path d="M6 6l12 12" />
                    </svg>
                    Remover imagem
                  </button>
                </div>
              ) : (
                <label htmlFor="imagem" className={styles.dropzone}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 8h.01" />
                    <path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z" />
                    <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" />
                    <path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
                  </svg>
                  <span>Clique para adicionar uma imagem</span>
                  <span className={styles.dropzoneAjuda}>PNG, JPG ou WEBP</span>
                </label>
              )}

              <input
                id="imagem"
                ref={inputImagemRef}
                type="file"
                accept="image/*"
                onChange={handleSelecionarImagem}
                className={styles.inputArquivoOculto}
              />
            </div>

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
              <MarkdownEditor
                id="conteudo"
                value={conteudo}
                onChange={setConteudo}
                placeholder="Escreva o conteúdo do post... (suporta markdown)"
                rows={14}
              />
            </div>

            <button type="submit" className={styles.botaoSalvar} disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}