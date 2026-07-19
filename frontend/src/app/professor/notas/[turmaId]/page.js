
// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import layoutStyles from "../../../page.module.css";
// import styles from "./notasTurma.module.css";

// const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

// const CAMPOS = [
//   "nm1_t1", "nm2_t1", "nm3_t1", "rpt_t1",
//   "nm1_t2", "nm2_t2", "nm3_t2", "rpt_t2",
//   "nm1_t3", "nm2_t3", "nm3_t3", "rpt_t3",
// ];

// const RF_OPCOES = [
//   ["CUR", "Cursando"], ["AP", "Aprovado"], ["RE", "Reprovado"],
//   ["DE", "Desistente"], ["FA", "Falecido"], ["AB", "Abandono"],
//   ["TR", "Transferido"], ["CA", "Cancelado"], ["TT", "Troca de Turma"],
//   ["TO", "Transferido Outros"], ["PP", "Para Progressão"], ["ND", "Não Definido"],
// ];

// export default function NotasTurmaPage() {
//   const { turmaId } = useParams();
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [professorId, setProfessorId] = useState(null);
//   const [disciplinaId, setDisciplinaId] = useState(null);
//   const [nomeTurma, setNomeTurma] = useState("");
//   const [alunos, setAlunos] = useState([]);
//   const [mensagem, setMensagem] = useState(null);
//   const [erros, setErros] = useState([]);

//   useEffect(() => {
//     async function init() {
//       try {
//         const authRes = await fetch(`${API_BASE}/api/teacher/auth`);
//         const authData = await authRes.json();
//         if (!authData.return) {
//           router.push("/professor/login");
//           return;
//         }
//         const profId = authData.teacher.id;
//         setProfessorId(profId);

//         const turmaRes = await fetch(`${API_BASE}/api/teacher/search/turma?turma=${turmaId}`);
//         if (!turmaRes.ok) throw new Error(`Falha ao buscar turma (status ${turmaRes.status})`);
//         const turmaData = await turmaRes.json();

//         const discId = turmaData.turma?.disciplina_id;
//         if (!discId) {
//           throw new Error("Não foi possível resolver o ID da disciplina a partir da turma.");
//         }
//         setDisciplinaId(discId);

//         const listaRes = await fetch(
//           `${API_BASE}/api/teacher/notas/turma/get?turma=${turmaId}&disciplina=${discId}&professor=${profId}`
//         );
//         if (!listaRes.ok) throw new Error(`Falha ao buscar notas da turma (status ${listaRes.status})`);
//         const listaData = await listaRes.json();

//         setNomeTurma(listaData.turma);
//         setAlunos(listaData.alunos || []);
//       } catch (error) {
//         setErros([`Erro ao carregar dados da turma: ${error.message}`]);
//       } finally {
//         setLoading(false);
//       }
//     }
//     init();
//   }, [turmaId, router]);

//   function handleChange(alunoId, campo, valor) {
//     if (campo !== "tgf" && campo !== "rf") {
//       if (!(valor === "" || (/^\d{0,2}(\.\d{0,2})?$/.test(valor) && Number(valor) <= 10))) {
//         return;
//       }
//     }

//     setAlunos((prev) =>
//       prev.map((a) =>
//         a.aluno_id === alunoId
//           ? { ...a, notas: { ...a.notas, [campo]: valor } }
//           : a
//       )
//     );
//   }

//   async function handleSalvarTudo() {
//     setSaving(true);
//     setMensagem(null);
//     setErros([]);

//     const lancamentos = alunos.map((a) => ({
//       aluno_id: a.aluno_id,
//       notas: a.notas,
//     }));

//     try {
//       const res = await fetch(`${API_BASE}/api/teacher/notas/turma/salvar`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           turma: turmaId,
//           disciplina: disciplinaId,
//           professor: professorId,
//           lancamentos,
//         }),
//       });

//       if (!res.ok) throw new Error(`Falha ao salvar (status ${res.status})`);

//       const data = await res.json();

//       const todosErros = [
//         ...(data.erros_gerais || []),
//         ...data.resultado.flatMap((r) =>
//           r.erros.length ? r.erros.map((e) => `${r.nome_completo}: ${e}`) : []
//         ),
//       ];

//       if (todosErros.length) {
//         setErros(todosErros);
//       } else {
//         setMensagem("Notas de toda a turma salvas com sucesso.");
//       }

//       setAlunos((prev) =>
//         prev.map((a) => {
//           const atualizado = data.resultado.find((r) => r.aluno_id === a.aluno_id);
//           return atualizado ? { ...a, notas: { ...a.notas, ...atualizado.notas } } : a;
//         })
//       );
//     } catch (error) {
//       setErros([`Erro ao salvar notas da turma: ${error.message}`]);
//     } finally {
//       setSaving(false);
//     }
//   }

//   if (loading) {
//     return (
//       <div className={layoutStyles.page}>
//         <p>Carregando...</p>
//       </div>
//     );
//   }

//   return (
//     <div className={layoutStyles.page}>
//       <div className={layoutStyles.content}>
//         <main className={layoutStyles.main}>
//           <div className={styles.wrapper}>
//             <h1 className={styles.title}>Lançar notas — {nomeTurma}</h1>
//             <p className={styles.subtitle}>{alunos.length} aluno(s)</p>

//             {erros.length > 0 && (
//               <ul className={styles.listaErros}>
//                 {erros.map((e, i) => (
//                   <li key={i}>{e}</li>
//                 ))}
//               </ul>
//             )}
//             {mensagem && <p className={styles.mensagemSucesso}>{mensagem}</p>}

//             {alunos.length === 0 ? (
//               <p className={styles.subtitle}>Nenhum aluno encontrado para esta turma.</p>
//             ) : (
//               <div className={styles.tabelaWrapper}>
//                 <table className={styles.tabela}>
//                   <thead>
//                     <tr>
//                       <th className={styles.stickyColNum} rowSpan={2}>Nº</th>
//                       <th className={styles.stickyCol} rowSpan={2}>Aluno</th>
//                       <th colSpan={4}>1º Trimestre</th>
//                       <th colSpan={4}>2º Trimestre</th>
//                       <th colSpan={4}>3º Trimestre</th>
//                       <th rowSpan={2}>PF</th>
//                       <th rowSpan={2}>RCF</th>
//                       <th rowSpan={2}>TGF</th>
//                       <th rowSpan={2}>RF</th>
//                     </tr>
//                     <tr>
//                       <th>NM1</th><th>NM2</th><th>NM3</th><th>RPT</th>
//                       <th>NM1</th><th>NM2</th><th>NM3</th><th>RPT</th>
//                       <th>NM1</th><th>NM2</th><th>NM3</th><th>RPT</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {alunos.map((aluno) => (
//                       <tr key={aluno.aluno_id}>{console.log(aluno["posicao_ordem"])}
//                         <td className={styles.stickyColNum}>{aluno["posicao_ordem"] ?? "—"}</td>
//                         <td className={styles.stickyCol} title={aluno.nome_completo}>
//                           {aluno.nome_completo}
//                         </td>
//                         {CAMPOS.map((campo) => (
//                           <td key={campo}>
//                             <input
//                               type="text"
//                               inputMode="decimal"
//                               className={styles.input}
//                               value={aluno.notas[campo] ?? ""}
//                               onChange={(e) => handleChange(aluno.aluno_id, campo, e.target.value)}
//                             />
//                           </td>
//                         ))}
//                         <td>
//                           <input
//                             type="text"
//                             inputMode="decimal"
//                             className={styles.input}
//                             value={aluno.notas.pf ?? ""}
//                             onChange={(e) => handleChange(aluno.aluno_id, "pf", e.target.value)}
//                           />
//                         </td>
//                         <td>
//                           <input
//                             type="text"
//                             inputMode="decimal"
//                             className={styles.input}
//                             value={aluno.notas.rcf ?? ""}
//                             onChange={(e) => handleChange(aluno.aluno_id, "rcf", e.target.value)}
//                           />
//                         </td>
//                         <td>
//                           <input
//                             type="number"
//                             min="0"
//                             className={styles.input}
//                             value={aluno.notas.tgf ?? 0}
//                             onChange={(e) => handleChange(aluno.aluno_id, "tgf", e.target.value)}
//                           />
//                         </td>
//                         <td>
//                           <select
//                             className={styles.select}
//                             value={aluno.notas.rf ?? "CUR"}
//                             onChange={(e) => handleChange(aluno.aluno_id, "rf", e.target.value)}
//                           >
//                             {RF_OPCOES.map(([valor]) => (
//                               <option key={valor} value={valor}>{valor}</option>
//                             ))}
//                           </select>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}

//             <button
//               onClick={handleSalvarTudo}
//               disabled={saving || alunos.length === 0}
//               className={styles.botaoSalvar}
//             >
//               {saving ? "Salvando..." : "Salvar notas da turma"}
//             </button>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }



// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import layoutStyles from "../../../page.module.css";
// import styles from "./notasTurma.module.css";

// const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

// const CAMPOS = [
//   "nm1_t1", "nm2_t1", "nm3_t1", "rpt_t1",
//   "nm1_t2", "nm2_t2", "nm3_t2", "rpt_t2",
//   "nm1_t3", "nm2_t3", "nm3_t3", "rpt_t3",
// ];

// const RF_OPCOES = [
//   ["CUR", "Cursando"], ["AP", "Aprovado"], ["RE", "Reprovado"],
//   ["DE", "Desistente"], ["FA", "Falecido"], ["AB", "Abandono"],
//   ["TR", "Transferido"], ["CA", "Cancelado"], ["TT", "Troca de Turma"],
//   ["TO", "Transferido Outros"], ["PP", "Para Progressão"], ["ND", "Não Definido"],
// ];

// export default function NotasTurmaPage() {
//   const { turmaId } = useParams();
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [professorId, setProfessorId] = useState(null);
//   const [nomeDisciplina, setNomeDisciplina] = useState("");
//   const [nomeTurma, setNomeTurma] = useState("");
//   const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState([]);
//   const [alunos, setAlunos] = useState([]);
//   const [mensagem, setMensagem] = useState(null);
//   const [erros, setErros] = useState([]);

//   useEffect(() => {
//     async function init() {
//       try {
//         const authRes = await fetch(`${API_BASE}/api/teacher/auth`);
//         const authData = await authRes.json();
//         if (!authData.return) {
//           router.push("/professor/login");
//           return;
//         }
//         const profId = authData.teacher.id;
//         setProfessorId(profId);

//         // Busca todas as disciplinas que este professor leciona para o
//         // mesmo grupo de alunos (mesma turma) do turmaId atual.
//         const discRes = await fetch(
//           `${API_BASE}/api/teacher/turma/disciplinas?turma=${turmaId}&professor=${profId}`
//         );
//         if (!discRes.ok) throw new Error(`Falha ao buscar disciplinas (status ${discRes.status})`);
//         const discData = await discRes.json();

//         setDisciplinasDisponiveis(discData.disciplinas || []);
//         setNomeTurma(discData.nome_turma || "");

//         const atual = discData.disciplinas?.find((d) => String(d.turma_id) === String(turmaId));
//         setNomeDisciplina(atual?.disciplina || "");

//         // Busca a lista de alunos e notas para o turmaId (disciplina) atual
//         const listaRes = await fetch(
//           `${API_BASE}/api/teacher/notas/turma/get?turma=${turmaId}&professor=${profId}`
//         );
//         if (!listaRes.ok) throw new Error(`Falha ao buscar notas da turma (status ${listaRes.status})`);
//         const listaData = await listaRes.json();

//         setAlunos(listaData.alunos || []);
//       } catch (error) {
//         setErros([`Erro ao carregar dados da turma: ${error.message}`]);
//       } finally {
//         setLoading(false);
//       }
//     }
//     init();
//   }, [turmaId, router]);

//   function handleTrocarDisciplina(novoTurmaId) {
//     router.push(`/professor/notas/turma/${novoTurmaId}`);
//   }

//   function handleChange(alunoId, campo, valor) {
//     if (campo !== "tgf" && campo !== "rf") {
//       if (!(valor === "" || (/^\d{0,2}(\.\d{0,2})?$/.test(valor) && Number(valor) <= 10))) {
//         return;
//       }
//     }

//     setAlunos((prev) =>
//       prev.map((a) =>
//         a.aluno_id === alunoId
//           ? { ...a, notas: { ...a.notas, [campo]: valor } }
//           : a
//       )
//     );
//   }

//   async function handleSalvarTudo() {
//     setSaving(true);
//     setMensagem(null);
//     setErros([]);

//     const lancamentos = alunos.map((a) => ({
//       aluno_id: a.aluno_id,
//       notas: a.notas,
//     }));

//     try {
//       const res = await fetch(`${API_BASE}/api/teacher/notas/turma/salvar`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           turma: turmaId,
//           professor: professorId,
//           lancamentos,
//         }),
//       });

//       if (!res.ok) throw new Error(`Falha ao salvar (status ${res.status})`);

//       const data = await res.json();

//       const todosErros = [
//         ...(data.erros_gerais || []),
//         ...data.resultado.flatMap((r) =>
//           r.erros.length ? r.erros.map((e) => `${r.nome_completo}: ${e}`) : []
//         ),
//       ];

//       if (todosErros.length) {
//         setErros(todosErros);
//       } else {
//         setMensagem("Notas de toda a turma salvas com sucesso.");
//       }

//       setAlunos((prev) =>
//         prev.map((a) => {
//           const atualizado = data.resultado.find((r) => r.aluno_id === a.aluno_id);
//           return atualizado ? { ...a, notas: { ...a.notas, ...atualizado.notas } } : a;
//         })
//       );
//     } catch (error) {
//       setErros([`Erro ao salvar notas da turma: ${error.message}`]);
//     } finally {
//       setSaving(false);
//     }
//   }

//   if (loading) {
//     return (
//       <div className={layoutStyles.page}>
//         <p>Carregando...</p>
//       </div>
//     );
//   }

//   return (
//     <div className={layoutStyles.page}>
//       <div className={layoutStyles.content}>
//         <main className={layoutStyles.main}>
//           <div className={styles.wrapper}>
//             <h1 className={styles.title}>Lançar notas — {nomeTurma}</h1>

//             {disciplinasDisponiveis.length > 1 ? (
//               <div className={styles.seletorDisciplina}>
//                 <label className={styles.seletorLabel}>Disciplina</label>
//                 <select
//                   className={styles.seletorSelect}
//                   value={turmaId}
//                   onChange={(e) => handleTrocarDisciplina(e.target.value)}
//                 >
//                   {disciplinasDisponiveis.map((d) => (
//                     <option key={d.turma_id} value={d.turma_id}>
//                       {d.disciplina}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             ) : (
//               <p className={styles.subtitle}>
//                 Disciplina: {nomeDisciplina || "—"} · {alunos.length} aluno(s)
//               </p>
//             )}

//             {disciplinasDisponiveis.length > 1 && (
//               <p className={styles.subtitle}>{alunos.length} aluno(s)</p>
//             )}

//             {erros.length > 0 && (
//               <ul className={styles.listaErros}>
//                 {erros.map((e, i) => (
//                   <li key={i}>{e}</li>
//                 ))}
//               </ul>
//             )}
//             {mensagem && <p className={styles.mensagemSucesso}>{mensagem}</p>}

//             {alunos.length === 0 ? (
//               <p className={styles.subtitle}>Nenhum aluno encontrado para esta turma.</p>
//             ) : (
//               <div className={styles.tabelaWrapper}>
//                 <table className={styles.tabela}>
//                   <thead>
//                     <tr>
//                       <th className={styles.stickyColNum} rowSpan={2}>Nº</th>
//                       <th className={styles.stickyCol} rowSpan={2}>Aluno</th>
//                       <th colSpan={4}>1º Trimestre</th>
//                       <th colSpan={4}>2º Trimestre</th>
//                       <th colSpan={4}>3º Trimestre</th>
//                       <th rowSpan={2}>PF</th>
//                       <th rowSpan={2}>RCF</th>
//                       <th rowSpan={2}>TGF</th>
//                       <th rowSpan={2}>RF</th>
//                     </tr>
//                     <tr>
//                       <th>NM1</th><th>NM2</th><th>NM3</th><th>RPT</th>
//                       <th>NM1</th><th>NM2</th><th>NM3</th><th>RPT</th>
//                       <th>NM1</th><th>NM2</th><th>NM3</th><th>RPT</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {alunos.map((aluno) => (
//                       <tr key={aluno.aluno_id}>
//                         <td className={styles.stickyColNum}>{aluno.posicao_ordem ?? "—"}</td>
//                         <td className={styles.stickyCol} title={aluno.nome_completo}>
//                           {aluno.nome_completo}
//                         </td>
//                         {CAMPOS.map((campo) => (
//                           <td key={campo}>
//                             <input
//                               type="text"
//                               inputMode="decimal"
//                               className={styles.input}
//                               value={aluno.notas[campo] ?? ""}
//                               onChange={(e) => handleChange(aluno.aluno_id, campo, e.target.value)}
//                             />
//                           </td>
//                         ))}
//                         <td>
//                           <input
//                             type="text"
//                             inputMode="decimal"
//                             className={styles.input}
//                             value={aluno.notas.pf ?? ""}
//                             onChange={(e) => handleChange(aluno.aluno_id, "pf", e.target.value)}
//                           />
//                         </td>
//                         <td>
//                           <input
//                             type="text"
//                             inputMode="decimal"
//                             className={styles.input}
//                             value={aluno.notas.rcf ?? ""}
//                             onChange={(e) => handleChange(aluno.aluno_id, "rcf", e.target.value)}
//                           />
//                         </td>
//                         <td>
//                           <input
//                             type="number"
//                             min="0"
//                             className={styles.input}
//                             value={aluno.notas.tgf ?? 0}
//                             onChange={(e) => handleChange(aluno.aluno_id, "tgf", e.target.value)}
//                           />
//                         </td>
//                         <td>
//                           <select
//                             className={styles.select}
//                             value={aluno.notas.rf ?? "CUR"}
//                             onChange={(e) => handleChange(aluno.aluno_id, "rf", e.target.value)}
//                           >
//                             {RF_OPCOES.map(([valor]) => (
//                               <option key={valor} value={valor}>{valor}</option>
//                             ))}
//                           </select>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}

//             <button
//               onClick={handleSalvarTudo}
//               disabled={saving || alunos.length === 0}
//               className={styles.botaoSalvar}
//             >
//               {saving ? "Salvando..." : "Salvar notas da turma"}
//             </button>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import layoutStyles from "../../../page.module.css";
import styles from "./notasTurma.module.css";

const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

const CAMPOS = [
  "nm1_t1", "nm2_t1", "nm3_t1", "rpt_t1",
  "nm1_t2", "nm2_t2", "nm3_t2", "rpt_t2",
  "nm1_t3", "nm2_t3", "nm3_t3", "rpt_t3",
];

const RF_OPCOES = [
  ["CUR", "Cursando"], ["AP", "Aprovado"], ["RE", "Reprovado"],
  ["DE", "Desistente"], ["FA", "Falecido"], ["AB", "Abandono"],
  ["TR", "Transferido"], ["CA", "Cancelado"], ["TT", "Troca de Turma"],
  ["TO", "Transferido Outros"], ["PP", "Para Progressão"], ["ND", "Não Definido"],
];

export default function NotasTurmaPage() {
  const { turmaId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [professorId, setProfessorId] = useState(null);
  const [nomeTurma, setNomeTurma] = useState("");
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState([]);
  const [disciplinaEscolhida, setDisciplinaEscolhida] = useState(null); // { turma_id, disciplina }
  const [carregandoNotas, setCarregandoNotas] = useState(false);
  const [alunos, setAlunos] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [erros, setErros] = useState([]);

  // Etapa 1: autentica e busca as disciplinas disponíveis para essa turma
  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`);
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/professor/login");
          return;
        }
        const profId = authData.teacher.id;
        setProfessorId(profId);

        const discRes = await fetch(
          `${API_BASE}/api/teacher/turma/disciplinas?turma=${turmaId}&professor=${profId}`
        );
        if (!discRes.ok) throw new Error(`Falha ao buscar disciplinas (status ${discRes.status})`);
        const discData = await discRes.json();

        setNomeTurma(discData.nome_turma || "");
        setDisciplinasDisponiveis(discData.disciplinas || []);

        // Se só existe uma disciplina, seleciona automaticamente
        if (discData.disciplinas?.length === 1) {
          setDisciplinaEscolhida(discData.disciplinas[0]);
        }
      } catch (error) {
        setErros([`Erro ao carregar disciplinas da turma: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [turmaId, router]);

  // Etapa 2: quando uma disciplina é escolhida, busca os alunos e notas dela
  useEffect(() => {
    if (!disciplinaEscolhida || !professorId) return;

    async function carregarNotas() {
      setCarregandoNotas(true);
      setErros([]);
      setMensagem(null);

      try {
        const listaRes = await fetch(
          `${API_BASE}/api/teacher/notas/turma/get?turma=${disciplinaEscolhida.turma_id}&professor=${professorId}`
        );
        if (!listaRes.ok) throw new Error(`Falha ao buscar notas da turma (status ${listaRes.status})`);
        const listaData = await listaRes.json();

        setAlunos(listaData.alunos || []);
      } catch (error) {
        setErros([`Erro ao carregar notas: ${error.message}`]);
      } finally {
        setCarregandoNotas(false);
      }
    }

    carregarNotas();
  }, [disciplinaEscolhida, professorId]);

  function handleChange(alunoId, campo, valor) {
    if (campo !== "tgf" && campo !== "rf") {
      if (!(valor === "" || (/^\d{0,2}(\.\d{0,2})?$/.test(valor) && Number(valor) <= 10))) {
        return;
      }
    }

    setAlunos((prev) =>
      prev.map((a) =>
        a.aluno_id === alunoId
          ? { ...a, notas: { ...a.notas, [campo]: valor } }
          : a
      )
    );
  }

  async function handleSalvarTudo() {
    setSaving(true);
    setMensagem(null);
    setErros([]);

    const lancamentos = alunos.map((a) => ({
      aluno_id: a.aluno_id,
      notas: a.notas,
    }));

    try {
      const res = await fetch(`${API_BASE}/api/teacher/notas/turma/salvar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turma: disciplinaEscolhida.turma_id,
          professor: professorId,
          lancamentos,
        }),
      });

      if (!res.ok) throw new Error(`Falha ao salvar (status ${res.status})`);

      const data = await res.json();

      const todosErros = [
        ...(data.erros_gerais || []),
        ...data.resultado.flatMap((r) =>
          r.erros.length ? r.erros.map((e) => `${r.nome_completo}: ${e}`) : []
        ),
      ];

      if (todosErros.length) {
        setErros(todosErros);
      } else {
        setMensagem("Notas de toda a turma salvas com sucesso.");
      }

      setAlunos((prev) =>
        prev.map((a) => {
          const atualizado = data.resultado.find((r) => r.aluno_id === a.aluno_id);
          return atualizado ? { ...a, notas: { ...a.notas, ...atualizado.notas } } : a;
        })
      );
    } catch (error) {
      setErros([`Erro ao salvar notas da turma: ${error.message}`]);
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
            <h1 className={styles.title}>Lançar notas — {nomeTurma}</h1>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}

            {!disciplinaEscolhida ? (
              <>
                <p className={styles.subtitle}>Escolha a disciplina para lançar as notas.</p>

                {disciplinasDisponiveis.length === 0 ? (
                  <p className={styles.subtitle}>Nenhuma disciplina encontrada para esta turma.</p>
                ) : (
                  <div className={styles.disciplinasEscolha}>
                    {disciplinasDisponiveis.map((d) => (
                      <button
                        key={d.turma_id}
                        className={styles.disciplinaBotao}
                        onClick={() => setDisciplinaEscolhida(d)}
                      >
                        {d.disciplina}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.disciplinaAtual}>
                  <span className={styles.disciplinaAtualLabel}>
                    Disciplina: <strong>{disciplinaEscolhida.disciplina}</strong>
                  </span>

                  {disciplinasDisponiveis.length > 1 && (
                    <button
                      className={styles.trocarBotao}
                      onClick={() => {
                        setDisciplinaEscolhida(null);
                        setAlunos([]);
                        setMensagem(null);
                        setErros([]);
                      }}
                    >
                      Trocar disciplina
                    </button>
                  )}
                </div>

                {carregandoNotas ? (
                  <p className={styles.subtitle}>Carregando alunos...</p>
                ) : (
                  <>
                    <p className={styles.subtitle}>{alunos.length} aluno(s)</p>

                    {mensagem && <p className={styles.mensagemSucesso}>{mensagem}</p>}

                    {alunos.length === 0 ? (
                      <p className={styles.subtitle}>Nenhum aluno encontrado para esta turma.</p>
                    ) : (
                      <div className={styles.tabelaWrapper}>
                        <table className={styles.tabela}>
                          <thead>
                            <tr>
                              <th className={styles.stickyColNum} rowSpan={2}>Nº</th>
                              <th className={styles.stickyCol} rowSpan={2}>Aluno</th>
                              <th colSpan={4}>1º Trimestre</th>
                              <th colSpan={4}>2º Trimestre</th>
                              <th colSpan={4}>3º Trimestre</th>
                              <th rowSpan={2}>PF</th>
                              <th rowSpan={2}>RCF</th>
                              <th rowSpan={2}>TGF</th>
                              <th rowSpan={2}>RF</th>
                            </tr>
                            <tr>
                              <th>NM1</th><th>NM2</th><th>NM3</th><th>RPT</th>
                              <th>NM1</th><th>NM2</th><th>NM3</th><th>RPT</th>
                              <th>NM1</th><th>NM2</th><th>NM3</th><th>RPT</th>
                            </tr>
                          </thead>
                          <tbody>
                            {alunos.map((aluno) => (
                              <tr key={aluno.aluno_id}>
                                <td className={styles.stickyColNum}>{aluno.posicao_ordem ?? "—"}</td>
                                <td className={styles.stickyCol} title={aluno.nome_completo}>
                                  {aluno.nome_completo}
                                </td>
                                {CAMPOS.map((campo) => (
                                  <td key={campo}>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      className={styles.input}
                                      value={aluno.notas[campo] ?? ""}
                                      onChange={(e) => handleChange(aluno.aluno_id, campo, e.target.value)}
                                    />
                                  </td>
                                ))}
                                <td>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    className={styles.input}
                                    value={aluno.notas.pf ?? ""}
                                    onChange={(e) => handleChange(aluno.aluno_id, "pf", e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    className={styles.input}
                                    value={aluno.notas.rcf ?? ""}
                                    onChange={(e) => handleChange(aluno.aluno_id, "rcf", e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    min="0"
                                    className={styles.input}
                                    value={aluno.notas.tgf ?? 0}
                                    onChange={(e) => handleChange(aluno.aluno_id, "tgf", e.target.value)}
                                  />
                                </td>
                                <td>
                                  <select
                                    className={styles.select}
                                    value={aluno.notas.rf ?? "CUR"}
                                    onChange={(e) => handleChange(aluno.aluno_id, "rf", e.target.value)}
                                  >
                                    {RF_OPCOES.map(([valor]) => (
                                      <option key={valor} value={valor}>{valor}</option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <button
                      onClick={handleSalvarTudo}
                      disabled={saving || alunos.length === 0}
                      className={styles.botaoSalvar}
                    >
                      {saving ? "Salvando..." : "Salvar notas da turma"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}