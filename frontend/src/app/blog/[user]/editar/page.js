"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

const STATUS_OPCOES = [
  { valor: "", label: "Prefiro não dizer" },
  { valor: "SOLTEIRO", label: "Solteiro(a)" },
  { valor: "NAMORANDO", label: "Namorando" },
  { valor: "CASADO", label: "Casado(a)" },
  { valor: "COMPLICADO", label: "É complicado" },
  { valor: "NAO_INFORMAR", label: "Prefiro não informar" },
];

export default function EditarPerfilPage() {
  const { user } = useParams();
  const router = useRouter();
  const inputFotoRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permitido, setPermitido] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [bio, setBio] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [statusRelacionamento, setStatusRelacionamento] = useState("");
  const [fotoAtualUrl, setFotoAtualUrl] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [removerFoto, setRemoverFoto] = useState(false);
  const [erros, setErros] = useState([]);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`${API_BASE}/api/blog/perfil/${user}`, { credentials: "include" });
        if (!res.ok) throw new Error("Perfil não encontrado.");
        const data = await res.json();

        if (!data.perfil.eh_proprio_perfil) {
          setErros(["Você não tem permissão para editar este perfil."]);
          setLoading(false);
          return;
        }

        setPermitido(true);
        setNomeUsuario(data.perfil.nome_usuario);
        setBio(data.perfil.bio || "");
        setDataNascimento(data.perfil.data_nascimento || "");
        setStatusRelacionamento(data.perfil.status_relacionamento || "");
        setFotoAtualUrl(data.perfil.foto_perfil_url ? `${API_BASE}${data.perfil.foto_perfil_url}` : null);
      } catch (error) {
        setErros([error.message]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  function handleSelecionarFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErros(["O arquivo selecionado precisa ser uma imagem."]);
      return;
    }
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
    setRemoverFoto(false);
    setErros([]);
  }

  function handleRemoverFoto() {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoFile(null);
    setFotoPreview(null);
    setFotoAtualUrl(null);
    setRemoverFoto(true);
    if (inputFotoRef.current) inputFotoRef.current.value = "";
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSaving(true);
    setErros([]);
    setMensagem(null);

    try {
      const formData = new FormData();
      formData.append("nome_usuario", nomeUsuario.trim().toLowerCase());
      formData.append("bio", bio.trim());
      formData.append("data_nascimento", dataNascimento);
      formData.append("status_relacionamento", statusRelacionamento);
      if (fotoFile) formData.append("foto_perfil", fotoFile);
      if (removerFoto) formData.append("remover_foto", "true");

      const res = await fetch(`${API_BASE}/api/blog/perfil/${user}/editar`, {
        method: "POST",
        body: formData,
        credentials: "include",
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

      const data = await res.json();
      setMensagem("Perfil atualizado com sucesso.");
      setTimeout(() => {
        router.push(`/blog/${data.nome_usuario}`);
      }, 700);
    } catch (error) {
      setErros([error.message]);
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
          <h1 className={styles.title}>Editar perfil</h1>
          <button type="button" className={styles.voltarBotao} onClick={() => router.push(`/blog/${user}`)}>
            Voltar
          </button>
        </div>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
        {mensagem && <p className={styles.mensagemSucesso}>{mensagem}</p>}

        {permitido && (
          <form className={styles.form} onSubmit={handleSalvar}>
            <div className={styles.campo}>
              <label className={styles.label}>Foto de perfil</label>
              {fotoPreview || fotoAtualUrl ? (
                <div className={styles.previewWrapper}>
                  <img src={fotoPreview || fotoAtualUrl} alt="Pré-visualização" className={styles.previewFoto} />
                  <button type="button" className={styles.removerFotoBotao} onClick={handleRemoverFoto}>
                    Remover foto
                  </button>
                </div>
              ) : (
                <label htmlFor="foto_perfil" className={styles.dropzone}>
                  Clique para adicionar uma foto
                </label>
              )}
              <input
                id="foto_perfil"
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                onChange={handleSelecionarFoto}
                className={styles.inputArquivoOculto}
              />
            </div>

            <div className={styles.campo}>
              <label className={styles.label} htmlFor="nome_usuario">Nome de usuário</label>
              <div className={styles.usernameInputWrapper}>
                <span>@</span>
                <input
                  id="nome_usuario"
                  type="text"
                  className={styles.input}
                  value={nomeUsuario}
                  onChange={(e) => setNomeUsuario(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.campo}>
              <label className={styles.label} htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                className={styles.textarea}
                rows={3}
                maxLength={280}
                placeholder="Conte um pouco sobre você..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <span className={styles.contador}>{bio.length}/280</span>
            </div>

            <div className={styles.linhaDupla}>
              <div className={styles.campo}>
                <label className={styles.label} htmlFor="data_nascimento">Data de nascimento</label>
                <input
                  id="data_nascimento"
                  type="date"
                  className={styles.input}
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                />
              </div>

              <div className={styles.campo}>
                <label className={styles.label} htmlFor="status_relacionamento">Status de relacionamento</label>
                <select
                  id="status_relacionamento"
                  className={styles.select}
                  value={statusRelacionamento}
                  onChange={(e) => setStatusRelacionamento(e.target.value)}
                >
                  {STATUS_OPCOES.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>{opcao.label}</option>
                  ))}
                </select>
              </div>
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