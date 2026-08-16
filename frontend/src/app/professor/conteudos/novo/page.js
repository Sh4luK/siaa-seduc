"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import layoutStyles from "../../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://q0w7c17l-8000.brs.devtunnels.ms";

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
  const [disciplinasDaTurma, setDisciplinasDaTurma] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [erros, setErros] = useState([]);
  const [arquivoNome, setArquivoNome] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    data: hojeISO(),
    descricao: "",
    turma_id: "",
    arquivo: null,
  });

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/professor/login");
          return;
        }
        setProfessorId(authData.teacher.id);
        setNomeCompleto(authData.teacher.nome_completo);

        const turmasRes = await fetch(
          `${API_BASE}/api/teacher/search/turmas?nome_completo=${encodeURIComponent(authData.teacher.nome_completo)}`
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

  function handleTurmaChange(nomeTurma) {
    const grupo = turmasAgrupadas.find((g) => g.nomeTurma === nomeTurma);
    const opcoes = grupo ? grupo.opcoes : [];
    setDisciplinasDaTurma(opcoes);
    handleFormChange("turma_id", opcoes.length === 1 ? String(opcoes[0].id) : "");
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
    if (!form.turma_id) {
      setErros(["Selecione a turma e a disciplina."]);
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
      formData.append("turma", form.turma_id);
      formData.append("titulo", form.titulo.trim());
      formData.append("descricao", form.descricao.trim());
      formData.append("data", form.data);
      if (form.arquivo) {
        formData.append("arquivo", form.arquivo);
      }

      const res = await fetch(`${API_BASE}/api/teacher/conteudos/criar`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const corpoErro = await res.text();
        throw new Error(`Falha ao criar conteúdo (status ${res.status}) - ${corpoErro}`);
      }

      setMensagem("Conteúdo criado com sucesso.");
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
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={layoutStyles.page}>
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

              <div className={styles.linhaDupla}>
                <div className={styles.campo}>
                  <label className={styles.label} htmlFor="turma">
                    Turma <span className={styles.obrigatorio}>*</span>
                  </label>
                  <select
                    id="turma"
                    className={styles.select}
                    onChange={(e) => handleTurmaChange(e.target.value)}
                    defaultValue=""
                    required
                  >
                    <option value="" disabled>Selecione a turma</option>
                    {turmasAgrupadas.map((grupo) => (
                      <option key={grupo.nomeTurma} value={grupo.nomeTurma}>
                        {grupo.nomeTurma}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.campo}>
                  <label className={styles.label} htmlFor="materia">
                    Matéria <span className={styles.obrigatorio}>*</span>
                  </label>
                  <select
                    id="materia"
                    className={styles.select}
                    value={form.turma_id}
                    onChange={(e) => handleFormChange("turma_id", e.target.value)}
                    disabled={disciplinasDaTurma.length === 0}
                    required
                  >
                    <option value="" disabled>
                      {disciplinasDaTurma.length === 0 ? "Escolha a turma primeiro" : "Selecione a matéria"}
                    </option>
                    {disciplinasDaTurma.map((opcao) => (
                      <option key={opcao.id} value={opcao.id}>
                        {opcao.disciplina_lecionada}
                      </option>
                    ))}
                  </select>
                </div>
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