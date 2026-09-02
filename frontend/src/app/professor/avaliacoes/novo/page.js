// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import styles from "./page.module.css";

// const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

// function novaQuestao() {
//   return {
//     enunciado: "",
//     tipo: "OBJETIVA",
//     imagemFile: null,
//     imagemPreview: null,
//     alternativas: [
//       { letra: "A", texto: "", correta: false },
//       { letra: "B", texto: "", correta: false },
//       { letra: "C", texto: "", correta: false },
//       { letra: "D", texto: "", correta: false },
//     ],
//   };
// }

// export default function NovaAvaliacaoPage() {
//   const router = useRouter();
//   const [titulo, setTitulo] = useState("");
//   const [turma, setTurma] = useState("");
//   const [disciplinaId, setDisciplinaId] = useState("");
//   const [data, setData] = useState("");
//   const [questoes, setQuestoes] = useState([novaQuestao()]);
//   const [salvando, setSalvando] = useState(false);
//   const [erro, setErro] = useState(null);

//   function atualizarQuestao(index, campo, valor) {
//     setQuestoes((prev) => {
//       const copia = [...prev];
//       copia[index] = { ...copia[index], [campo]: valor };
//       return copia;
//     });
//   }

//   function atualizarAlternativa(qIndex, aIndex, campo, valor) {
//     setQuestoes((prev) => {
//       const copia = [...prev];
//       const alternativas = [...copia[qIndex].alternativas];
//       alternativas[aIndex] = { ...alternativas[aIndex], [campo]: valor };
//       copia[qIndex] = { ...copia[qIndex], alternativas };
//       return copia;
//     });
//   }

//   function handleImagem(index, file) {
//     if (!file) return;
//     const preview = URL.createObjectURL(file);
//     atualizarQuestao(index, "imagemFile", file);
//     atualizarQuestao(index, "imagemPreview", preview);
//   }

//   function adicionarQuestao() {
//     setQuestoes((prev) => [...prev, novaQuestao()]);
//   }

//   function removerQuestao(index) {
//     setQuestoes((prev) => prev.filter((_, i) => i !== index));
//   }

//   async function salvar() {
//     setSalvando(true);
//     setErro(null);
//     try {
//       const payload = {
//         titulo,
//         turma,
//         disciplina_id: disciplinaId,
//         data,
//         ano_letivo: new Date(data).getFullYear(),
//         questoes: questoes.map((q) => ({
//           enunciado: q.enunciado,
//           tipo: q.tipo,
//           alternativas: q.tipo === "OBJETIVA" ? q.alternativas : [],
//         })),
//       };

//       const res = await fetch(`${API_BASE}/api/teacher/avaliacoes`, {
//         method: "POST",
//         credentials: "include",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const corpoErro = await res.text();
//         let message = "Erro ao salvar avaliação";
//         try {
//           message = JSON.parse(corpoErro).message || message;
//         } catch {}
//         throw new Error(message);
//       }

//       const { id } = await res.json();

//       // upload de imagens (se houver) — precisa dos ids das questões criadas
//       // opcional: buscar a avaliação recém-criada e mapear por ordem para enviar as imagens

//       router.push(`/professor/avaliacoes/${id}`);
//     } catch (e) {
//       setErro(e.message);
//     } finally {
//       setSalvando(false);
//     }
//   }

//   return (
//     <div className={styles.container}>
//       <h1>Nova avaliação</h1>

//       <div className={styles.dadosGerais}>
//         <input
//           placeholder="Título da avaliação"
//           value={titulo}
//           onChange={(e) => setTitulo(e.target.value)}
//         />
//         <input
//           placeholder="Turma"
//           value={turma}
//           onChange={(e) => setTurma(e.target.value)}
//         />
//         <input
//           placeholder="ID da disciplina"
//           value={disciplinaId}
//           onChange={(e) => setDisciplinaId(e.target.value)}
//         />
//         <input
//           type="date"
//           value={data}
//           onChange={(e) => setData(e.target.value)}
//         />
//       </div>

//       {erro && <p className={styles.erro}>{erro}</p>}

//       <div className={styles.questoesLista}>
//         {questoes.map((q, index) => (
//           <div key={index} className={styles.questaoCard}>
//             <div className={styles.questaoHeader}>
//               <span>Questão {index + 1}</span>
//               <div className={styles.tipoToggle}>
//                 <button
//                   className={q.tipo === "OBJETIVA" ? styles.tipoAtivo : ""}
//                   onClick={() => atualizarQuestao(index, "tipo", "OBJETIVA")}
//                 >
//                   Objetiva
//                 </button>
//                 <button
//                   className={q.tipo === "SUBJETIVA" ? styles.tipoAtivo : ""}
//                   onClick={() => atualizarQuestao(index, "tipo", "SUBJETIVA")}
//                 >
//                   Subjetiva
//                 </button>
//               </div>
//               {questoes.length > 1 && (
//                 <button className={styles.removerBotao} onClick={() => removerQuestao(index)}>
//                   Remover
//                 </button>
//               )}
//             </div>

//             <textarea
//               placeholder="Enunciado da questão"
//               value={q.enunciado}
//               onChange={(e) => atualizarQuestao(index, "enunciado", e.target.value)}
//             />

//             <div className={styles.imagemArea}>
//               {q.imagemPreview ? (
//                 <img src={q.imagemPreview} alt="Imagem da questão" className={styles.imagemPreview} />
//               ) : (
//                 <label className={styles.imagemPlaceholder}>
//                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <rect x="3" y="3" width="18" height="18" rx="2" />
//                     <circle cx="8.5" cy="8.5" r="1.5" />
//                     <path d="M21 15l-5-5L5 21" />
//                   </svg>
//                   <span>Adicionar imagem</span>
//                   <input
//                     type="file"
//                     accept="image/*"
//                     hidden
//                     onChange={(e) => handleImagem(index, e.target.files[0])}
//                   />
//                 </label>
//               )}
//             </div>

//             {q.tipo === "OBJETIVA" && (
//               <div className={styles.alternativas}>
//                 {q.alternativas.map((alt, aIndex) => (
//                   <div key={alt.letra} className={styles.alternativaLinha}>
//                     <input
//                       type="radio"
//                       name={`correta-${index}`}
//                       checked={alt.correta}
//                       onChange={() => {
//                         setQuestoes((prev) => {
//                           const copia = [...prev];
//                           copia[index] = {
//                             ...copia[index],
//                             alternativas: copia[index].alternativas.map((a, i) => ({
//                               ...a,
//                               correta: i === aIndex,
//                             })),
//                           };
//                           return copia;
//                         });
//                       }}
//                     />
//                     <span>{alt.letra})</span>
//                     <input
//                       placeholder={`Alternativa ${alt.letra}`}
//                       value={alt.texto}
//                       onChange={(e) => atualizarAlternativa(index, aIndex, "texto", e.target.value)}
//                     />
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       <button className={styles.adicionarBotao} onClick={adicionarQuestao}>
//         + Adicionar questão
//       </button>

//       <button className={styles.salvarBotao} onClick={salvar} disabled={salvando}>
//         {salvando ? "Salvando..." : "Salvar avaliação"}
//       </button>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Image from "next/image";
import logo from "@/assets/logo.png";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function novaQuestao() {
  return {
    id: crypto.randomUUID(),
    enunciado: "",
    tipo: "OBJETIVA",
    imagemFile: null,
    imagemPreview: null,
    alternativas: [
      { letra: "A", texto: "", correta: false },
      { letra: "B", texto: "", correta: false },
      { letra: "C", texto: "", correta: false },
      { letra: "D", texto: "", correta: false },
    ],
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

  const [erros, setErros] = useState([]);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/professor/login");
          return;
        }

        const opcoesRes = await fetch(`${API_BASE}/api/teacher/opcoes-avaliacao`);
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

  async function handleSalvar(e) {
    e.preventDefault();
    setSaving(true);
    setErros([]);
    setMensagem(null);

    const errosValidacao = [];
    if (!titulo.trim()) errosValidacao.push("O título da avaliação é obrigatório.");
    if (!data) errosValidacao.push("A data é obrigatória.");
    if (!turma) errosValidacao.push("Selecione a turma.");
    if (!disciplina) errosValidacao.push("Selecione a matéria.");

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          turma,
          disciplina,
          data,
          ano_letivo: new Date(data).getFullYear(),
          questoes: questoes.map((q) => ({
            enunciado: q.enunciado,
            tipo: q.tipo,
            alternativas: q.tipo === "OBJETIVA" ? q.alternativas : [],
          })),
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
          <button
            type="button"
            className={styles.voltarBotao}
            onClick={() => router.push("/professor/avaliacoes")}
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
                Matéria <span className={styles.obrigatorio}>*</span>
              </label>
              <select
                className={styles.select}
                value={disciplina}
                onChange={(e) => setDisciplina(e.target.value)}
                disabled={!turma}
              >
                <option value="" disabled>
                  {turma ? "Selecione a matéria" : "Selecione a turma primeiro"}
                </option>
                {disciplinasDisponiveis.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.secaoDivisor}>
            <h2 className={styles.secaoTitulo}>Questões</h2>
            <p className={styles.secaoSubtitulo}>
              Adicione as questões da avaliação, com imagem opcional e tipo objetiva ou subjetiva.
            </p>
          </div>

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
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button type="button" className={styles.adicionarVinculoBotao} onClick={adicionarQuestao}>
            + Adicionar questão
          </button>

          <button type="submit" className={styles.botaoSalvar} disabled={saving}>
            {saving ? "Salvando..." : "Salvar avaliação"}
          </button>
        </form>
      </div>
    </div>
  );
}