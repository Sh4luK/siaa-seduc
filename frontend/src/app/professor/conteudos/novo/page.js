"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import layoutStyles from "../../page.module.css";
import styles from "./page.module.css";
import Image from "next/image";
import logo from "../../../../assets/logo.png";
import SeletorTurmas from "../../SeletorTurmas";
const API_BASE = "/backend-api";

function hojeISO() {
  const hoje = new Date();
  const offset = hoje.getTimezoneOffset();
  const local = new Date(hoje.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

export default function NovoConteudoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [professorId, setProfessorId] = useState(null);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [turmasAgrupadas, setTurmasAgrupadas] = useState([]);
  const [turmasSelecionadas, setTurmasSelecionadas] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [erros, setErros] = useState([]);
  const [arquivoNome, setArquivoNome] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    data: hojeISO(),
    descricao: "",
    arquivo: null,
  });

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`, { credentials: "include" });
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/professor/login");
          return;
        }
        setProfessorId(authData.teacher.id);
        setNomeCompleto(authData.teacher.nome_completo);

        const turmasRes = await fetch(
          `${API_BASE}/api/teacher/search/turmas?nome_completo=${encodeURIComponent(authData.teacher.nome_completo)}`,
          { credentials: "include" }
        );
        if (turmasRes.ok) {
          const turmasData = await turmasRes.json();
          const turmas = turmasData.turmas || [];

          const grupos = {};
          for (const turma of turmas) {
            const chave = turma.turma;
            if (!grupos[chave]) {
              grupos[chave] = { nomeTurma: chave, opcoes: [] };
            }
            grupos[chave].opcoes.push(turma);
          }
          setTurmasAgrupadas(Object.values(grupos));
        }
      } catch (error) {
        setErros([`Erro ao carregar dados: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  function handleFormChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function handleArquivoChange(e) {
    const file = e.target.files?.[0] || null;
    handleFormChange("arquivo", file);
    setArquivoNome(file ? file.name : "");
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSaving(true);
    setMensagem(null);
    setErros([]);

    if (!form.titulo.trim()) {
      setErros(["O título é obrigatório."]);
      setSaving(false);
      return;
    }
    if (turmasSelecionadas.length === 0) {
      setErros(["Selecione pelo menos uma turma."]);
      setSaving(false);
      return;
    }
    if (!form.data) {
      setErros(["A data é obrigatória."]);
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("professor", professorId);
      turmasSelecionadas.forEach((id) => formData.append("turmas", id));
      formData.append("titulo", form.titulo.trim());
      formData.append("descricao", form.descricao.trim());
      formData.append("data", form.data);
      if (form.arquivo) {
        formData.append("arquivo", form.arquivo);
      }

      const res = await fetch(`${API_BASE}/api/teacher/conteudos/criar`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const corpoErro = await res.text();
        throw new Error(`Falha ao criar conteúdo (status ${res.status}) - ${corpoErro}`);
      }

      const data = await res.json();
      setMensagem(data.message || "Conteúdo criado com sucesso.");
      setTimeout(() => {
        router.push("/professor/conteudos");
      }, 900);
    } catch (error) {
      setErros([`Erro ao salvar conteúdo: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}>
            <span className={layoutStyles.loadingBarFill} />
          </div>
          <p className={layoutStyles.loadingText}>Verificando credenciais…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={layoutStyles.content}>
        <main className={layoutStyles.main}>
          <div className={styles.wrapper}>
            <div className={styles.headerRow}>
              <div>
                <h1 className={styles.title}>Novo conteúdo</h1>
                <p className={styles.subtitle}>Cadastre um conteúdo ministrado em aula.</p>
              </div>
              <button
                type="button"
                className={styles.voltarBotao}
                onClick={() => router.push("/professor/conteudos")}
              >
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
                  placeholder="Ex: Introdução a funções, Revolução Industrial..."
                  value={form.titulo}
                  onChange={(e) => handleFormChange("titulo", e.target.value)}
                  required
                />
              </div>

              <div className={styles.campo}>
                <label className={styles.label} htmlFor="professor">
                  Professor
                </label>
                <input
                  id="professor"
                  type="text"
                  className={styles.input}
                  value={nomeCompleto}
                  disabled
                />
              </div>

              <div className={styles.campo}>
                <span className={styles.label}>
                  Turmas e disciplinas <span className={styles.obrigatorio}>*</span>
                </span>
                <SeletorTurmas
                  turmasAgrupadas={turmasAgrupadas}
                  selecionadas={turmasSelecionadas}
                  onChange={setTurmasSelecionadas}
                />
                {turmasSelecionadas.length > 1 && (
                  <p className={styles.avisoTodasTurmas} role="status">
                    O conteúdo será cadastrado em cada uma das {turmasSelecionadas.length} turmas/disciplinas marcadas.
                  </p>
                )}
              </div>

              <div className={styles.campo}>
                <label className={styles.label} htmlFor="data">
                  Data <span className={styles.obrigatorio}>*</span>
                </label>
                <input
                  id="data"
                  type="date"
                  className={styles.input}
                  value={form.data}
                  onChange={(e) => handleFormChange("data", e.target.value)}
                  required
                />
              </div>

              <div className={styles.campo}>
                <label className={styles.label} htmlFor="descricao">
                  Descrição <span className={styles.opcional}>(opcional)</span>
                </label>
                <textarea
                  id="descricao"
                  className={styles.textarea}
                  placeholder="Detalhes sobre o conteúdo ministrado..."
                  value={form.descricao}
                  onChange={(e) => handleFormChange("descricao", e.target.value)}
                  rows={4}
                />
              </div>

              <div className={styles.campo}>
                <label className={styles.label} htmlFor="arquivo">
                  Arquivo <span className={styles.opcional}>(opcional)</span>
                </label>
                <label htmlFor="arquivo" className={styles.arquivoUpload}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 15l3 -3l3 3" />
                    <path d="M12 12l0 9" />
                    <path d="M20.39 18.39a5 5 0 0 0 -1.39 -9.39h-1.53a6 6 0 0 0 -11.87 1.5a4 4 0 0 0 -1.6 7.5" />
                  </svg>
                  {arquivoNome || "Clique para selecionar um arquivo"}
                </label>
                <input
                  id="arquivo"
                  type="file"
                  className={styles.arquivoInput}
                  onChange={handleArquivoChange}
                />
              </div>

              <button type="submit" className={styles.botaoSalvar} disabled={saving}>
                {saving ? "Salvando..." : "Criar conteúdo"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}