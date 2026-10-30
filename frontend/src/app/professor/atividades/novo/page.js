"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import layoutStyles from "../../page.module.css";
import styles from "./page.module.css";
import Image from "next/image";
import logo from "@/assets/logo.png";
import SeletorTurmas from "../../SeletorTurmas";

const API_BASE = "/backend-api";
const LETRAS = "ABCDEFGHIJ";

function hojeISO() {
  const hoje = new Date();
  const offset = hoje.getTimezoneOffset();
  const local = new Date(hoje.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

function novaQuestao() {
  return {
    id: crypto.randomUUID(),
    enunciado: "",
    tipo: "OBJETIVA",
    alternativas: [0, 1, 2, 3].map(() => ({ texto: "", correta: false })),
  };
}

export default function NovaAtividadePage() {
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
  // "arquivo": atividade com anexo; "questoes": o aluno responde na plataforma
  const [modo, setModo] = useState("arquivo");
  const [questoes, setQuestoes] = useState([novaQuestao()]);

  const [form, setForm] = useState({
    titulo: "",
    data: hojeISO(),
    data_entrega: "",
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

  function atualizarQuestao(id, campo, valor) {
    setQuestoes((prev) => prev.map((q) => (q.id === id ? { ...q, [campo]: valor } : q)));
  }

  function atualizarAlternativa(qId, aIndex, texto) {
    setQuestoes((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const alternativas = q.alternativas.map((a, i) => (i === aIndex ? { ...a, texto } : a));
        return { ...q, alternativas };
      })
    );
  }

  function marcarCorreta(qId, aIndex) {
    setQuestoes((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, alternativas: q.alternativas.map((a, i) => ({ ...a, correta: i === aIndex })) }
          : q
      )
    );
  }

  function adicionarAlternativa(qId) {
    setQuestoes((prev) =>
      prev.map((q) =>
        q.id === qId && q.alternativas.length < LETRAS.length
          ? { ...q, alternativas: [...q.alternativas, { texto: "", correta: false }] }
          : q
      )
    );
  }

  function removerAlternativa(qId, aIndex) {
    setQuestoes((prev) =>
      prev.map((q) =>
        q.id === qId && q.alternativas.length > 2
          ? { ...q, alternativas: q.alternativas.filter((_, i) => i !== aIndex) }
          : q
      )
    );
  }

  function validarQuestoes() {
    const problemas = [];
    questoes.forEach((q, i) => {
      if (!q.enunciado.trim()) problemas.push(`Questão ${i + 1}: escreva o enunciado.`);
      if (q.tipo === "OBJETIVA") {
        const preenchidas = q.alternativas.filter((a) => a.texto.trim());
        if (preenchidas.length < 2) problemas.push(`Questão ${i + 1}: preencha pelo menos duas alternativas.`);
        if (!preenchidas.some((a) => a.correta)) problemas.push(`Questão ${i + 1}: marque a alternativa correta.`);
      }
    });
    return problemas;
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setMensagem(null);
    setErros([]);

    const problemas = [];
    if (!form.titulo.trim()) problemas.push("O título é obrigatório.");
    if (turmasSelecionadas.length === 0) problemas.push("Selecione pelo menos uma turma.");
    if (!form.data) problemas.push("A data é obrigatória.");
    if (form.data_entrega && form.data_entrega < form.data) {
      problemas.push("A data de entrega não pode ser anterior à data de envio.");
    }
    if (modo === "questoes") problemas.push(...validarQuestoes());
    if (problemas.length) {
      setErros(problemas);
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("professor", professorId);
      turmasSelecionadas.forEach((id) => formData.append("turmas", id));
      formData.append("titulo", form.titulo.trim());
      formData.append("descricao", form.descricao.trim());
      formData.append("data", form.data);
      if (form.data_entrega) {
        formData.append("data_entrega", form.data_entrega);
      }
      if (modo === "arquivo" && form.arquivo) {
        formData.append("arquivo", form.arquivo);
      }
      if (modo === "questoes") {
        formData.append(
          "questoes",
          JSON.stringify(
            questoes.map((q) => ({
              enunciado: q.enunciado.trim(),
              tipo: q.tipo,
              alternativas: q.tipo === "OBJETIVA" ? q.alternativas : [],
            }))
          )
        );
      }

      const res = await fetch(`${API_BASE}/api/teacher/atividades/criar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        let detalhe = "";
        try {
          detalhe = (await res.json()).message || "";
        } catch {
          detalhe = `status ${res.status}`;
        }
        throw new Error(detalhe);
      }

      const data = await res.json();
      setMensagem(data.message || "Atividade criada com sucesso.");
      setTimeout(() => {
        router.push("/professor/atividades");
      }, 900);
    } catch (error) {
      setErros([`Erro ao salvar atividade: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
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
                <h1 className={styles.title}>Nova atividade</h1>
                <p className={styles.subtitle}>Envie uma atividade para a turma.</p>
              </div>
              <button
                type="button"
                className={styles.voltarBotao}
                onClick={() => router.push("/professor/atividades")}
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
                  placeholder="Ex: Lista de exercícios cap. 3, Trabalho em grupo..."
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
                    A atividade será cadastrada em cada uma das {turmasSelecionadas.length} turmas/disciplinas marcadas.
                  </p>
                )}
              </div>

              <div className={styles.linhaDupla}>
                <div className={styles.campo}>
                  <label className={styles.label} htmlFor="data">
                    Data de envio <span className={styles.obrigatorio}>*</span>
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
                  <label className={styles.label} htmlFor="data_entrega">
                    Data de entrega <span className={styles.opcional}>(opcional)</span>
                  </label>
                  <input
                    id="data_entrega"
                    type="date"
                    className={styles.input}
                    value={form.data_entrega}
                    min={form.data}
                    onChange={(e) => handleFormChange("data_entrega", e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.campo}>
                <label className={styles.label} htmlFor="descricao">
                  Descrição <span className={styles.opcional}>(opcional)</span>
                </label>
                <textarea
                  id="descricao"
                  className={styles.textarea}
                  placeholder="Instruções sobre a atividade..."
                  value={form.descricao}
                  onChange={(e) => handleFormChange("descricao", e.target.value)}
                  rows={4}
                />
              </div>

              <div className={styles.campo}>
                <span className={styles.label}>Formato da atividade</span>
                <div className={styles.modoToggle} role="radiogroup" aria-label="Formato da atividade">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={modo === "arquivo"}
                    className={modo === "arquivo" ? styles.modoAtivo : styles.modoBotao}
                    onClick={() => setModo("arquivo")}
                  >
                    Anexar arquivo
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={modo === "questoes"}
                    className={modo === "questoes" ? styles.modoAtivo : styles.modoBotao}
                    onClick={() => setModo("questoes")}
                  >
                    Questões na plataforma
                  </button>
                </div>
                <p className={styles.dica}>
                  {modo === "arquivo"
                    ? "O aluno baixa o arquivo (se houver) e envia a resposta como arquivo ou texto."
                    : "O aluno responde as questões direto no SIAA. As objetivas são conferidas automaticamente na correção."}
                </p>
              </div>

              {modo === "arquivo" ? (
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
              ) : (
                <div className={styles.questoes}>
                  {questoes.map((q, index) => (
                    <div key={q.id} className={styles.questaoCard}>
                      <div className={styles.questaoHeader}>
                        <span className={styles.questaoNumero}>Questão {index + 1}</span>
                        <div className={styles.tipoToggle}>
                          {[["OBJETIVA", "Objetiva"], ["SUBJETIVA", "Dissertativa"]].map(([valor, rotulo]) => (
                            <button
                              key={valor}
                              type="button"
                              className={q.tipo === valor ? styles.tipoAtivo : styles.tipoBotao}
                              onClick={() => atualizarQuestao(q.id, "tipo", valor)}
                            >
                              {rotulo}
                            </button>
                          ))}
                        </div>
                        {questoes.length > 1 && (
                          <button
                            type="button"
                            className={styles.removerBotao}
                            onClick={() => setQuestoes((prev) => prev.filter((x) => x.id !== q.id))}
                          >
                            Remover
                          </button>
                        )}
                      </div>

                      <textarea
                        className={styles.textarea}
                        placeholder="Enunciado da questão"
                        aria-label={`Enunciado da questão ${index + 1}`}
                        value={q.enunciado}
                        onChange={(e) => atualizarQuestao(q.id, "enunciado", e.target.value)}
                        rows={3}
                      />

                      {q.tipo === "OBJETIVA" ? (
                        <div className={styles.alternativas}>
                          <span className={styles.dica}>Marque a alternativa correta:</span>
                          {q.alternativas.map((alt, aIndex) => (
                            <div key={aIndex} className={styles.alternativaLinha}>
                              <input
                                type="radio"
                                name={`correta-${q.id}`}
                                aria-label={`Alternativa ${LETRAS[aIndex]} é a correta`}
                                checked={alt.correta}
                                onChange={() => marcarCorreta(q.id, aIndex)}
                              />
                              <span className={styles.alternativaLetra}>{LETRAS[aIndex]})</span>
                              <input
                                type="text"
                                className={styles.input}
                                placeholder={`Alternativa ${LETRAS[aIndex]}`}
                                value={alt.texto}
                                onChange={(e) => atualizarAlternativa(q.id, aIndex, e.target.value)}
                              />
                              {q.alternativas.length > 2 && (
                                <button
                                  type="button"
                                  className={styles.removerAlternativa}
                                  aria-label={`Remover alternativa ${LETRAS[aIndex]}`}
                                  onClick={() => removerAlternativa(q.id, aIndex)}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                          {q.alternativas.length < LETRAS.length && (
                            <button
                              type="button"
                              className={styles.linkBotao}
                              onClick={() => adicionarAlternativa(q.id)}
                            >
                              + Alternativa
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className={styles.dica}>O aluno responde com um texto livre.</p>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className={styles.adicionarQuestao}
                    onClick={() => setQuestoes((prev) => [...prev, novaQuestao()])}
                  >
                    + Adicionar questão
                  </button>
                </div>
              )}

              <button type="submit" className={styles.botaoSalvar} disabled={saving}>
                {saving ? "Salvando..." : "Enviar atividade"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
