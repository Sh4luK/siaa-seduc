"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Image from "next/image";
import logo from "@/assets/logo.png";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function gerarLetra(index) {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letras[index] || letras[letras.length - 1];
}

function novaQuestao() {
  return {
    id: crypto.randomUUID(),
    enunciado: "",
    tipo: "OBJETIVA",
    imagemFile: null,
    imagemPreview: null,
    linhasResposta: 2,
    alternativas: [
      { letra: "A", texto: "", correta: false },
      { letra: "B", texto: "", correta: false },
      { letra: "C", texto: "", correta: false },
      { letra: "D", texto: "", correta: false },
    ],
    subquestoes: [],
  };
}

function novaSubquestao() {
  return {
    id: crypto.randomUUID(),
    letra: "",
    enunciado: "",
    tipo: "SUBJETIVA",
    linhasResposta: 2,
    alternativas: [],
  };
}

export default function NovaAvaliacaoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [professorNome, setProfessorNome] = useState("");
  const [turmas, setTurmas] = useState([]);
  const [disciplinasPorTurma, setDisciplinasPorTurma] = useState({});

  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [turma, setTurma] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [questoes, setQuestoes] = useState([novaQuestao()]);
  const [modoQuestoes, setModoQuestoes] = useState("manual");
  const [arquivoQuestoes, setArquivoQuestoes] = useState(null);
  const [arquivoNome, setArquivoNome] = useState("");
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [textoIntrodutorio, setTextoIntrodutorio] = useState("");

  const [erros, setErros] = useState([]);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`, { credentials: "include" });
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/professor/login");
          return;
        }

        const opcoesRes = await fetch(`${API_BASE}/api/teacher/opcoes-avaliacao`, { credentials: "include" });
        if (!opcoesRes.ok) throw new Error(`Falha ao buscar opções (status ${opcoesRes.status})`);
        const opcoesData = await opcoesRes.json();

        setProfessorNome(opcoesData.professor?.nome_completo || "");
        setTurmas(opcoesData.turmas || []);
        setDisciplinasPorTurma(opcoesData.disciplinas_por_turma || {});
      } catch (error) {
        setErros([`Erro ao carregar dados: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  function handleTurmaChange(novaTurma) {
    setTurma(novaTurma);
    setDisciplina("");
  }

  function atualizarQuestao(id, campo, valor) {
    setQuestoes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [campo]: valor } : q))
    );
  }

  function atualizarAlternativa(qId, aIndex, campo, valor) {
    setQuestoes((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const alternativas = [...q.alternativas];
        alternativas[aIndex] = { ...alternativas[aIndex], [campo]: valor };
        return { ...q, alternativas };
      })
    );
  }

  function marcarCorreta(qId, aIndex) {
    setQuestoes((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              alternativas: q.alternativas.map((a, i) => ({ ...a, correta: i === aIndex })),
            }
          : q
      )
    );
  }

  function handleImagem(qId, file) {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    atualizarQuestao(qId, "imagemFile", file);
    atualizarQuestao(qId, "imagemPreview", preview);
  }

  function adicionarQuestao() {
    setQuestoes((prev) => [...prev, novaQuestao()]);
  }

  function removerQuestao(id) {
    setQuestoes((prev) => (prev.length > 1 ? prev.filter((q) => q.id !== id) : prev));
  }

  function adicionarAlternativa(qId) {
    setQuestoes((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const novaLetra = gerarLetra(q.alternativas.length);
        return {
          ...q,
          alternativas: [...q.alternativas, { letra: novaLetra, texto: "", correta: false }],
        };
      })
    );
  }

  function removerAlternativa(qId, aIndex) {
    setQuestoes((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if (q.alternativas.length <= 2) return q;
        const novasAlternativas = q.alternativas.filter((_, i) => i !== aIndex).map((a, i) => ({
          ...a,
          letra: gerarLetra(i),
        }));
        return { ...q, alternativas: novasAlternativas };
      })
    );
  }

  function adicionarSubquestao(qId) {
    setQuestoes((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const subquestoes = q.subquestoes || [];
        const novaLetra = String.fromCharCode(97 + subquestoes.length);
        return {
          ...q,
          subquestoes: [...subquestoes, { ...novaSubquestao(), letra: novaLetra }],
        };
      })
    );
  }

  function atualizarSubquestao(qId, sqId, campo, valor) {
    setQuestoes((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const subquestoes = q.subquestoes || [];
        const novasSubquestoes = subquestoes.map((sq) =>
          sq.id === sqId ? { ...sq, [campo]: valor } : sq
        );
        return { ...q, subquestoes: novasSubquestoes };
      })
    );
  }

  function removerSubquestao(qId, sqId) {
    setQuestoes((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const subquestoes = q.subquestoes || [];
        const novasSubquestoes = subquestoes.filter((sq) => sq.id !== sqId).map((sq, i) => ({
          ...sq,
          letra: String.fromCharCode(97 + i),
        }));
        return { ...q, subquestoes: novasSubquestoes };
      })
    );
  }

  function adicionarAlternativaSubquestao(qId, sqId) {
    setQuestoes((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const subquestoes = q.subquestoes || [];
        const novasSubquestoes = subquestoes.map((sq) => {
          if (sq.id !== sqId) return sq;
          const alternativas = sq.alternativas || [];
          const novaLetra = gerarLetra(alternativas.length);
          return {
            ...sq,
            alternativas: [...alternativas, { letra: novaLetra, texto: "", correta: false }],
          };
        });
        return { ...q, subquestoes: novasSubquestoes };
      })
    );
  }

  function atualizarAlternativaSubquestao(qId, sqId, aIndex, campo, valor) {
    setQuestoes((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const subquestoes = q.subquestoes || [];
        const novasSubquestoes = subquestoes.map((sq) => {
          if (sq.id !== sqId) return sq;
          const alternativas = sq.alternativas || [];
          const novasAlternativas = alternativas.map((a, i) =>
            i === aIndex ? { ...a, [campo]: valor } : a
          );
          return { ...sq, alternativas: novasAlternativas };
        });
        return { ...q, subquestoes: novasSubquestoes };
      })
    );
  }

  function marcarCorretaSubquestao(qId, sqId, aIndex) {
    setQuestoes((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const subquestoes = q.subquestoes || [];
        const novasSubquestoes = subquestoes.map((sq) => {
          if (sq.id !== sqId) return sq;
          const alternativas = sq.alternativas || [];
          return {
            ...sq,
            alternativas: alternativas.map((a, i) => ({ ...a, correta: i === aIndex })),
          };
        });
        return { ...q, subquestoes: novasSubquestoes };
      })
    );
  }

  function handleArquivoQuestoesChange(e) {
    const file = e.target.files?.[0] || null;
    setArquivoQuestoes(file);
    setArquivoNome(file ? file.name : "");
  }

  async function processarArquivoQuestoes() {
    if (!arquivoQuestoes) return;

    const formData = new FormData();
    formData.append("arquivo", arquivoQuestoes);

    try {
      const res = await fetch(`${API_BASE}/api/teacher/avaliacoes/extrair-questoes`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Falha ao processar arquivo");
      }

      const data = await res.json();
      const questoesExtraidas = data.questoes || [];
      const textoIntro = data.texto_introdutorio || "";
      const topicosExtraidos = data.topicos || {};

      if (questoesExtraidas.length === 0) {
        setErros(["Nenhuma questão encontrada no arquivo. Verifique se o formato está correto."]);
        return;
      }

      const novasQuestoes = questoesExtraidas.map((q, index) => ({
        id: crypto.randomUUID(),
        enunciado: q.enunciado || "",
        tipo: q.tipo || "SUBJETIVA",
        imagemFile: null,
        imagemPreview: null,
        linhasResposta: 2,
        topico: q.topico || null,
        alternativas: (q.alternativas || []).map((alt, i) => ({
          letra: alt.letra || gerarLetra(i),
          texto: alt.texto || "",
          correta: false,
        })),
        subquestoes: (q.subquestoes || []).map((sq, i) => ({
          id: crypto.randomUUID(),
          letra: sq.letra || String.fromCharCode(97 + i),
          enunciado: sq.enunciado || "",
          tipo: sq.tipo || "SUBJETIVA",
          linhasResposta: 2,
          alternativas: (sq.alternativas || []).map((alt, j) => ({
            letra: alt.letra || gerarLetra(j),
            texto: alt.texto || "",
            correta: false,
          })),
        })),
      }));

      setQuestoes(novasQuestoes);
      setTextoIntrodutorio(textoIntro);
      setMensagem(`${novasQuestoes.length} questões extraídas do arquivo com sucesso. ${Object.keys(topicosExtraidos).length > 1 ? `Detectados ${Object.keys(topicosExtraidos).length} tópicos.` : ''}`);
    } catch (error) {
      setErros([`Erro ao processar arquivo: ${error.message}`]);
    }
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSaving(true);
    setErros([]);
    setMensagem(null);

    const errosValidacao = [];
    if (!titulo.trim()) errosValidacao.push("O título da avaliação é obrigatório.");
    if (!data) errosValidacao.push("A data é obrigatória.");
    if (!turma) errosValidacao.push("Selecione a turma.");
    if (!disciplina) errosValidacao.push("Selecione a disciplina.");

    questoes.forEach((q, i) => {
      if (!q.enunciado.trim()) errosValidacao.push(`Questão ${i + 1}: o enunciado é obrigatório.`);
      if (q.tipo === "OBJETIVA" && q.alternativas.every((a) => !a.texto.trim())) {
        errosValidacao.push(`Questão ${i + 1}: preencha ao menos as alternativas.`);
      }
    });

    if (errosValidacao.length > 0) {
      setErros(errosValidacao);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/teacher/avaliacoes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          turma,
          disciplina,
          data,
          ano_letivo: new Date(data).getFullYear(),
          modo_questoes: modoQuestoes,
          questoes: questoes.map((q) => ({
            enunciado: q.enunciado,
            tipo: q.tipo,
            linhas_resposta: q.linhasResposta || 2,
            topico: q.topico || "",
            alternativas: q.tipo === "OBJETIVA" ? q.alternativas : [],
            subquestoes: (q.subquestoes || []).map((sq) => ({
              letra: sq.letra,
              enunciado: sq.enunciado,
              tipo: sq.tipo,
              linhas_resposta: sq.linhasResposta || 2,
              alternativas: sq.tipo === "OBJETIVA" ? sq.alternativas : [],
            })),
          })),
          texto_introdutorio: textoIntrodutorio,
        }),
      });

      if (!res.ok) {
        const corpoErro = await res.text();
        let msg = `Falha ao cadastrar (status ${res.status})`;
        try {
          const json = JSON.parse(corpoErro);
          if (json.message) msg = json.message;
        } catch {}
        throw new Error(msg);
      }

      setMensagem("Avaliação criada com sucesso.");
      const { id } = await res.json();
      setTimeout(() => {
        router.push(`/professor/avaliacoes/${id}`);
      }, 900);
    } catch (error) {
      setErros([`Erro ao criar avaliação: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <div className={styles.headerLoading}>
            <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
            <p className={styles.subtituloLoading}>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  const disciplinasDisponiveis = disciplinasPorTurma[turma] || [];

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Nova avaliação</h1>
            <p className={styles.subtitle}>Monte a prova com as questões e alternativas.</p>
          </div>
          <div className={styles.headerButtons}>
            <button
              type="button"
              className={styles.voltarBotao}
              onClick={() => router.push("/professor/avaliacoes")}
            >
              Voltar
            </button>
            <button
              type="button"
              className={styles.botaoSalvarTopo}
              onClick={() => document.querySelector('form').requestSubmit()}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar avaliação"}
            </button>
          </div>
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
            <label className={styles.label}>Professor</label>
            <input
              type="text"
              className={styles.inputDesabilitado}
              value={professorNome || "—"}
              disabled
            />
          </div>

          <div className={styles.linhaDupla}>
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="titulo">
                Título da avaliação <span className={styles.obrigatorio}>*</span>
              </label>
              <input
                id="titulo"
                type="text"
                className={styles.input}
                placeholder="Ex: Avaliação bimestral"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </div>

            <div className={styles.campo}>
              <label className={styles.label} htmlFor="data">
                Data <span className={styles.obrigatorio}>*</span>
              </label>
              <input
                id="data"
                type="date"
                className={styles.input}
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.linhaDupla}>
            <div className={styles.campo}>
              <label className={styles.label}>
                Turma <span className={styles.obrigatorio}>*</span>
              </label>
              <select
                className={styles.select}
                value={turma}
                onChange={(e) => handleTurmaChange(e.target.value)}
              >
                <option value="" disabled>Selecione a turma</option>
                {turmas.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className={styles.campo}>
              <label className={styles.label}>
                Disciplina <span className={styles.obrigatorio}>*</span>
              </label>
              <select
                className={styles.select}
                value={disciplina}
                onChange={(e) => setDisciplina(e.target.value)}
                disabled={!turma}
              >
                <option value="" disabled>
                  {turma ? "Selecione a disciplina" : "Selecione a turma primeiro"}
                </option>
                {disciplinasDisponiveis.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="texto-introdutorio">
              Texto introdutório (opcional)
            </label>
            <textarea
              id="texto-introdutorio"
              className={styles.textarea}
              placeholder="Ex: Leia o texto abaixo para responder as questões de 1-10"
              value={textoIntrodutorio}
              onChange={(e) => setTextoIntrodutorio(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.secaoDivisor}>
            <h2 className={styles.secaoTitulo}>Questões</h2>
            <p className={styles.secaoSubtitulo}>
              Adicione as questões da avaliação, com imagem opcional e tipo objetiva ou subjetiva.
            </p>
          </div>

          <div className={styles.campo}>
            <span className={styles.label}>Modo de entrada das questões</span>
            <div className={styles.modoToggle} role="radiogroup" aria-label="Modo de entrada das questões">
              <button
                type="button"
                role="radio"
                aria-checked={modoQuestoes === "manual"}
                className={modoQuestoes === "manual" ? styles.modoAtivo : styles.modoBotao}
                onClick={() => setModoQuestoes("manual")}
              >
                Digitar manualmente
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={modoQuestoes === "midia"}
                className={modoQuestoes === "midia" ? styles.modoAtivo : styles.modoBotao}
                onClick={() => setModoQuestoes("midia")}
              >
                Via mídia (PDF)
              </button>
            </div>
          </div>

          {modoQuestoes === "midia" && (
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="arquivo-questoes">
                Arquivo com questões <span className={styles.obrigatorio}>*</span>
              </label>
              <label htmlFor="arquivo-questoes" className={styles.arquivoUpload}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 15l3 -3l3 3" />
                  <path d="M12 12l0 9" />
                  <path d="M20.39 18.39a5 5 0 0 0 -1.39 -9.39h-1.53a6 6 0 0 0 -11.87 1.5a4 4 0 0 0 -1.6 7.5" />
                </svg>
                {arquivoNome || "Clique para selecionar um arquivo PDF"}
              </label>
              <input
                id="arquivo-questoes"
                type="file"
                className={styles.arquivoInput}
                accept=".pdf"
                onChange={handleArquivoQuestoesChange}
              />
              {arquivoQuestoes && (
                <button
                  type="button"
                  className={styles.processarArquivoBotao}
                  onClick={processarArquivoQuestoes}
                >
                  Processar arquivo
                </button>
              )}
            </div>
          )}

          {modoQuestoes === "manual" && (
            <div>
              {questoes.map((q, index) => (
            <div key={q.id} className={styles.vinculoCard}>
              <div className={styles.vinculoHeader}>
                <span className={styles.vinculoNumero}>Questão {index + 1}</span>
                <div className={styles.tipoToggle}>
                  <button
                    type="button"
                    className={q.tipo === "OBJETIVA" ? styles.tipoAtivo : styles.tipoBotao}
                    onClick={() => atualizarQuestao(q.id, "tipo", "OBJETIVA")}
                  >
                    Objetiva
                  </button>
                  <button
                    type="button"
                    className={q.tipo === "SUBJETIVA" ? styles.tipoAtivo : styles.tipoBotao}
                    onClick={() => atualizarQuestao(q.id, "tipo", "SUBJETIVA")}
                  >
                    Subjetiva
                  </button>
                </div>
                {questoes.length > 1 && (
                  <button
                    type="button"
                    className={styles.removerVinculoBotao}
                    onClick={() => removerQuestao(q.id)}
                  >
                    Remover
                  </button>
                )}
              </div>

              <div className={styles.campo}>
                <label className={styles.label}>
                  Enunciado <span className={styles.obrigatorio}>*</span>
                </label>
                <textarea
                  className={styles.textarea}
                  placeholder="Digite o enunciado da questão"
                  value={q.enunciado}
                  onChange={(e) => atualizarQuestao(q.id, "enunciado", e.target.value)}
                />
              </div>

              <div className={styles.campo}>
                <label className={styles.label}>Tópico (opcional)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ex: Situação A, Tópico 1, Caso 1"
                  value={q.topico || ""}
                  onChange={(e) => atualizarQuestao(q.id, "topico", e.target.value)}
                />
              </div>

              <div className={styles.campo}>
                <label className={styles.label}>Imagem (opcional)</label>
                {q.imagemPreview ? (
                  <div className={styles.imagemPreviewWrapper}>
                    <img src={q.imagemPreview} alt="" className={styles.imagemPreview} />
                    <button
                      type="button"
                      className={styles.removerVinculoBotao}
                      onClick={() => atualizarQuestao(q.id, "imagemPreview", null)}
                    >
                      Remover imagem
                    </button>
                  </div>
                ) : (
                  <label className={styles.imagemPlaceholder}>
                    <span>+ Adicionar imagem</span>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleImagem(q.id, e.target.files[0])}
                    />
                  </label>
                )}
              </div>

              {q.tipo === "OBJETIVA" && (
                <div className={styles.campo}>
                  <label className={styles.label}>Alternativas</label>
                  {q.alternativas.map((alt, aIndex) => (
                    <div key={alt.letra} className={styles.alternativaLinha}>
                      <input
                        type="radio"
                        name={`correta-${q.id}`}
                        checked={alt.correta}
                        onChange={() => marcarCorreta(q.id, aIndex)}
                      />
                      <span className={styles.alternativaLetra}>{alt.letra})</span>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder={`Alternativa ${alt.letra}`}
                        value={alt.texto}
                        onChange={(e) => atualizarAlternativa(q.id, aIndex, "texto", e.target.value)}
                      />
                      {q.alternativas.length > 2 && (
                        <button
                          type="button"
                          className={styles.removerAlternativaBotao}
                          onClick={() => removerAlternativa(q.id, aIndex)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.adicionarAlternativaBotao}
                    onClick={() => adicionarAlternativa(q.id)}
                  >
                    + Adicionar alternativa
                  </button>
                </div>
              )}

              {q.tipo === "SUBJETIVA" && (
                <div className={styles.campo}>
                  <label className={styles.label}>Linhas para resposta</label>
                  <input
                    type="number"
                    className={styles.input}
                    min="1"
                    max="20"
                    value={q.linhasResposta}
                    onChange={(e) => atualizarQuestao(q.id, "linhasResposta", parseInt(e.target.value) || 2)}
                  />
                </div>
              )}

              <div className={styles.campo}>
                <div className={styles.subquestoesHeader}>
                  <label className={styles.label}>Subitens (a, b, c...)</label>
                  <button
                    type="button"
                    className={styles.adicionarSubquestaoBotao}
                    onClick={() => adicionarSubquestao(q.id)}
                  >
                    + Adicionar subitem
                  </button>
                </div>
                {q.subquestoes.length > 0 && (
                  <div className={styles.subquestoesContainer}>
                    {q.subquestoes.map((sq) => (
                      <div key={sq.id} className={styles.subquestaoCard}>
                        <div className={styles.subquestaoHeader}>
                          <span className={styles.subquestaoLetra}>{sq.letra})</span>
                          <div className={styles.tipoToggle}>
                            <button
                              type="button"
                              className={sq.tipo === "OBJETIVA" ? styles.tipoAtivo : styles.tipoBotao}
                              onClick={() => atualizarSubquestao(q.id, sq.id, "tipo", "OBJETIVA")}
                            >
                              Objetiva
                            </button>
                            <button
                              type="button"
                              className={sq.tipo === "SUBJETIVA" ? styles.tipoAtivo : styles.tipoBotao}
                              onClick={() => atualizarSubquestao(q.id, sq.id, "tipo", "SUBJETIVA")}
                            >
                              Subjetiva
                            </button>
                          </div>
                          <button
                            type="button"
                            className={styles.removerSubquestaoBotao}
                            onClick={() => removerSubquestao(q.id, sq.id)}
                          >
                            ×
                          </button>
                        </div>
                        <textarea
                          className={styles.textarea}
                          placeholder={`Enunciado do subitem ${sq.letra}`}
                          value={sq.enunciado}
                          onChange={(e) => atualizarSubquestao(q.id, sq.id, "enunciado", e.target.value)}
                          rows={2}
                        />
                        {sq.tipo === "SUBJETIVA" && (
                          <div className={styles.campo}>
                            <label className={styles.label}>Linhas para resposta</label>
                            <input
                              type="number"
                              className={styles.input}
                              min="1"
                              max="20"
                              value={sq.linhasResposta}
                              onChange={(e) => atualizarSubquestao(q.id, sq.id, "linhasResposta", parseInt(e.target.value) || 2)}
                            />
                          </div>
                        )}
                        {sq.tipo === "OBJETIVA" && (
                          <div className={styles.alternativasSubquestao}>
                            {sq.alternativas.map((alt, aIndex) => (
                              <div key={alt.letra} className={styles.alternativaLinha}>
                                <input
                                  type="radio"
                                  name={`correta-${q.id}-${sq.id}`}
                                  checked={alt.correta}
                                  onChange={() => marcarCorretaSubquestao(q.id, sq.id, aIndex)}
                                />
                                <span className={styles.alternativaLetra}>{alt.letra})</span>
                                <input
                                  type="text"
                                  className={styles.input}
                                  placeholder={`Alternativa ${alt.letra}`}
                                  value={alt.texto}
                                  onChange={(e) => atualizarAlternativaSubquestao(q.id, sq.id, aIndex, "texto", e.target.value)}
                                />
                                {sq.alternativas.length > 2 && (
                                  <button
                                    type="button"
                                    className={styles.removerAlternativaBotao}
                                    onClick={() => {
                                      const novasAlternativas = sq.alternativas.filter((_, i) => i !== aIndex);
                                      atualizarSubquestao(q.id, sq.id, "alternativas", novasAlternativas);
                                    }}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              className={styles.adicionarAlternativaBotao}
                              onClick={() => adicionarAlternativaSubquestao(q.id, sq.id)}
                            >
                              + Adicionar alternativa
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <button type="button" className={styles.adicionarVinculoBotao} onClick={adicionarQuestao}>
            + Adicionar questão
          </button>
            </div>
          )}

          <div className={styles.previewToggle}>
            <button
              type="button"
              className={styles.previewBotao}
              onClick={() => setMostrarPreview(!mostrarPreview)}
            >
              {mostrarPreview ? "Ocultar pré-visualização" : "Ver pré-visualização da avaliação"}
            </button>
          </div>

          {mostrarPreview && (
            <div className={styles.previewContainer}>
              <div className={styles.previewHeader}>
                <h3 className={styles.previewTitle}>Pré-visualização da Avaliação</h3>
              </div>
              <div className={styles.previewContent}>
                <div className={styles.previewDados}>
                  <p><strong>Disciplina:</strong> {disciplina}</p>
                  <p><strong>Turma:</strong> {turma}</p>
                  <p><strong>Data:</strong> {data}</p>
                  <p><strong>Nome do aluno:</strong> ___________________________</p>
                </div>
                <h2 className={styles.previewTitulo}>{titulo}</h2>
                {textoIntrodutorio && (
                  <div className={styles.previewTextoIntro}>
                    {textoIntrodutorio}
                  </div>
                )}
                {questoes.map((q, index) => {
                  const topicoAnterior = index > 0 ? questoes[index - 1].topico : null;
                  const mostrarTopico = q.topico && q.topico !== topicoAnterior;
                  
                  return (
                    <div key={q.id} className={styles.previewQuestao}>
                      {mostrarTopico && (
                        <div className={styles.previewTopico}>{q.topico}</div>
                      )}
                      <p className={styles.previewQuestaoCompleto}>
                        <span className={styles.previewQuestaoNumero}>{index + 1}.</span> {q.enunciado}
                      </p>

                      {q.tipo === "OBJETIVA" && q.alternativas && q.alternativas.length > 0 && (
                        <div className={styles.previewAlternativas}>
                          {q.alternativas.map((alt) => (
                            <p key={alt.letra} className={styles.previewAlternativa}>
                              {alt.letra}) {alt.texto}
                            </p>
                          ))}
                        </div>
                      )}

                      {q.tipo === "SUBJETIVA" && (
                        <div className={styles.previewLinhas}>
                          {Array.from({ length: q.linhasResposta || 2 }).map((_, i) => (
                            <div key={i} className={styles.previewLinha}></div>
                          ))}
                        </div>
                      )}

                      {q.subquestoes && q.subquestoes.length > 0 && (
                        <div className={styles.previewSubquestoes}>
                          {q.subquestoes.map((sq) => (
                            <div key={sq.id} className={styles.previewSubquestao}>
                              <p className={styles.previewSubquestaoEnunciado}>
                                <span className={styles.previewSubquestaoLetra}>{sq.letra})</span> {sq.enunciado}
                              </p>
                              {sq.tipo === "OBJETIVA" && sq.alternativas && sq.alternativas.length > 0 && (
                                <div className={styles.previewAlternativas}>
                                  {sq.alternativas.map((alt) => (
                                    <p key={alt.letra} className={styles.previewAlternativa}>
                                      {alt.letra}) {alt.texto}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {sq.tipo === "SUBJETIVA" && (
                                <div className={styles.previewLinhas}>
                                  {Array.from({ length: sq.linhasResposta || 2 }).map((_, i) => (
                                    <div key={i} className={styles.previewLinha}></div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button type="submit" className={styles.botaoSalvar} disabled={saving}>
            {saving ? "Salvando..." : "Salvar avaliação"}
          </button>
        </form>
      </div>
    </div>
  );
}