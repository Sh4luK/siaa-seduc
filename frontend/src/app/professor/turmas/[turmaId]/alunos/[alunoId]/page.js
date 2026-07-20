// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import layoutStyles from "../../../../page.module.css";
// import styles from "./notas.module.css";

// const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

// const RF_OPCOES = [
//   ["CUR", "Cursando"], ["AP", "Aprovado"], ["RE", "Reprovado"],
//   ["DE", "Desistente"], ["FA", "Falecido"], ["AB", "Abandono"],
//   ["TR", "Transferido"], ["CA", "Cancelado"], ["TT", "Troca de Turma"],
//   ["TO", "Transferido Outros"], ["PP", "Para Progressão"], ["ND", "Não Definido"],
// ];

// export default function LancarNotasPage() {
//   const { turmaId, alunoId } = useParams();
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [aluno, setAluno] = useState(null);
//   const [professorId, setProfessorId] = useState(null);
//   const [nomeDisciplina, setNomeDisciplina] = useState("");
//   const [mensagem, setMensagem] = useState(null);
//   const [erros, setErros] = useState([]);

//   const [notas, setNotas] = useState({
//     nm1_t1: "", nm2_t1: "", nm3_t1: "", rpt_t1: "", mt_t1: null, mtf_t1: null,
//     nm1_t2: "", nm2_t2: "", nm3_t2: "", rpt_t2: "", mt_t2: null, mtf_t2: null,
//     nm1_t3: "", nm2_t3: "", nm3_t3: "", rpt_t3: "", mt_t3: null, mtf_t3: null,
//     ma: null, pf: "", maf: null, rcf: "", tgf: "0", rf: "CUR",
//   });

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

//         const notasUrl = `${API_BASE}/api/teacher/notas/get?aluno=${alunoId}&turma=${turmaId}&professor=${profId}`;
//         const notasRes = await fetch(notasUrl);

//         if (!notasRes.ok) throw new Error(`Falha ao buscar notas (status ${notasRes.status})`);
//         const notasData = await notasRes.json();

//         setAluno(notasData.aluno);
//         setNomeDisciplina(notasData.disciplina?.nome || "");
//         setNotas((prev) => ({
//           ...prev,
//           ...Object.fromEntries(
//             Object.entries(notasData.notas).map(([k, v]) => [
//               k,
//               v ?? (typeof prev[k] === "string" ? "" : null),
//             ])
//           ),
//         }));
//       } catch (error) {
//         setErros([`Erro ao carregar dados do aluno: ${error.message}`]);
//       } finally {
//         setLoading(false);
//       }
//     }

//     init();
//   }, [turmaId, alunoId, router]);

//   function handleChange(campo, valor) {
//     if (valor === "" || (/^\d{0,2}(\.\d{0,2})?$/.test(valor) && Number(valor) <= 10)) {
//       setNotas((prev) => ({ ...prev, [campo]: valor }));
//     }
//   }

//   async function handleSalvar() {
//     setSaving(true);
//     setMensagem(null);
//     setErros([]);

//     try {
//       const res = await fetch(`${API_BASE}/api/teacher/notas/salvar`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           aluno: alunoId,
//           turma: turmaId,
//           professor: professorId,
//           notas,
//         }),
//       });

//       if (!res.ok) throw new Error(`Falha ao salvar (status ${res.status})`);

//       const data = await res.json();

//       if (data.erros?.length) setErros(data.erros);
//       else setMensagem("Notas salvas com sucesso.");

//       if (data.notas) {
//         setNotas((prev) => ({ ...prev, ...data.notas }));
//       }
//     } catch (error) {
//       setErros([`Erro ao salvar as notas: ${error.message}`]);
//     } finally {
//       setSaving(false);
//     }
//   }

//   if (loading) {
//     return (
//       <div className={layoutStyles.page}>
//         <p className={styles.loadingText}>Carregando...</p>
//       </div>
//     );
//   }

//   return (
//     <div className={layoutStyles.page}>
//       <div className={layoutStyles.content}>
//         <main className={layoutStyles.main}>
//           <div className={styles.wrapper}>
//             <h1 className={styles.title}>
//               Lançar notas — {aluno?.nome_completo || "Aluno"}
//             </h1>
//             <p className={styles.subtitle}>Disciplina: {nomeDisciplina || "—"}</p>

//             {erros.length > 0 && (
//               <ul className={styles.listaErros}>
//                 {erros.map((e, i) => (
//                   <li key={i}>{e}</li>
//                 ))}
//               </ul>
//             )}
//             {mensagem && <p className={styles.mensagemSucesso}>{mensagem}</p>}

//             {aluno && (
//               <>
//                 <div className={styles.listaWrapper}>
//                   <div className={styles.listaHeader}>
//                     <span className={styles.colLabel}>Trimestre</span>
//                     <span className={styles.colLabel}>NM1</span>
//                     <span className={styles.colLabel}>NM2</span>
//                     <span className={styles.colLabel}>NM3</span>
//                     <span className={styles.colLabel}>MT</span>
//                     <span className={styles.colLabel}>RPT</span>
//                     <span className={styles.colLabel}>MTF</span>
//                   </div>

//                   {[1, 2, 3].map((t) => (
//                     <div key={t} className={styles.listaRow}>
//                       <span className={styles.rowLabel}>{t}º Trimestre</span>

//                       <input
//                         type="text"
//                         inputMode="decimal"
//                         className={styles.input}
//                         value={notas[`nm1_t${t}`]}
//                         onChange={(e) => handleChange(`nm1_t${t}`, e.target.value)}
//                       />
//                       <input
//                         type="text"
//                         inputMode="decimal"
//                         className={styles.input}
//                         value={notas[`nm2_t${t}`]}
//                         onChange={(e) => handleChange(`nm2_t${t}`, e.target.value)}
//                       />
//                       <input
//                         type="text"
//                         inputMode="decimal"
//                         className={styles.input}
//                         value={notas[`nm3_t${t}`]}
//                         onChange={(e) => handleChange(`nm3_t${t}`, e.target.value)}
//                       />
//                       <span className={styles.calculadoBadge}>
//                         {notas[`mt_t${t}`] ?? "—"}
//                       </span>
//                       <input
//                         type="text"
//                         inputMode="decimal"
//                         className={styles.input}
//                         value={notas[`rpt_t${t}`]}
//                         onChange={(e) => handleChange(`rpt_t${t}`, e.target.value)}
//                       />
//                       <span className={styles.calculadoBadge}>
//                         {notas[`mtf_t${t}`] ?? "—"}
//                       </span>
//                     </div>
//                   ))}
//                 </div>

//                 <div className={styles.resultadoWrapper}>
//                   <h3 className={styles.resultadoTitle}>Resultado Anual / Final</h3>

//                   <div className={styles.resultadoGrid}>
//                     <div className={styles.resultadoItem}>
//                       <span className={styles.resultadoLabel}>MA</span>
//                       <span className={styles.calculadoBadge}>{notas.ma ?? "—"}</span>
//                     </div>

//                     <div className={styles.resultadoItem}>
//                       <span className={styles.resultadoLabel}>PF</span>
//                       <input
//                         type="text"
//                         inputMode="decimal"
//                         className={styles.input}
//                         value={notas.pf}
//                         onChange={(e) => handleChange("pf", e.target.value)}
//                       />
//                     </div>

//                     <div className={styles.resultadoItem}>
//                       <span className={styles.resultadoLabel}>MAF</span>
//                       <span className={styles.calculadoBadge}>{notas.maf ?? "—"}</span>
//                     </div>

//                     <div className={styles.resultadoItem}>
//                       <span className={styles.resultadoLabel}>RCF</span>
//                       <input
//                         type="text"
//                         inputMode="decimal"
//                         className={styles.input}
//                         value={notas.rcf}
//                         onChange={(e) => handleChange("rcf", e.target.value)}
//                       />
//                     </div>

//                     <div className={styles.resultadoItem}>
//                       <span className={styles.resultadoLabel}>TGF</span>
//                       <input
//                         type="number"
//                         min="0"
//                         className={styles.input}
//                         value={notas.tgf}
//                         onChange={(e) => setNotas((prev) => ({ ...prev, tgf: e.target.value }))}
//                       />
//                     </div>

//                     <div className={styles.resultadoItem}>
//                       <span className={styles.resultadoLabel}>RF</span>
//                       <select
//                         className={styles.select}
//                         value={notas.rf}
//                         onChange={(e) => setNotas((prev) => ({ ...prev, rf: e.target.value }))}
//                       >
//                         {RF_OPCOES.map(([valor, label]) => (
//                           <option key={valor} value={valor}>{label}</option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>
//                 </div>

//                 <button onClick={handleSalvar} disabled={saving} className={styles.botaoSalvar}>
//                   {saving ? "Salvando..." : "Salvar notas"}
//                 </button>
//               </>
//             )}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import layoutStyles from "../../../../page.module.css";
import styles from "./notas.module.css";

const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

const RF_OPCOES = [
  ["CUR", "Cursando"], ["AP", "Aprovado"], ["RE", "Reprovado"],
  ["DE", "Desistente"], ["FA", "Falecido"], ["AB", "Abandono"],
  ["TR", "Transferido"], ["CA", "Cancelado"], ["TT", "Troca de Turma"],
  ["TO", "Transferido Outros"], ["PP", "Para Progressão"], ["ND", "Não Definido"],
];

// Retorna a classe de cor com base no valor da nota: menor que 6 = vermelho, 6+ = azul
function corDaNota(valor) {
  if (valor === "" || valor === null || valor === undefined) return "";
  const numero = Number(valor);
  if (Number.isNaN(numero)) return "";
  return numero < 6 ? styles.notaBaixa : styles.notaAlta;
}

export default function LancarNotasPage() {
  const { turmaId, alunoId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aluno, setAluno] = useState(null);
  const [professorId, setProfessorId] = useState(null);
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState([]);
  const [disciplinaEscolhida, setDisciplinaEscolhida] = useState(null); // { turma_id, disciplina }
  const [carregandoNotas, setCarregandoNotas] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [erros, setErros] = useState([]);

  const [notas, setNotas] = useState({
    nm1_t1: "", nm2_t1: "", nm3_t1: "", rpt_t1: "", mt_t1: null, mtf_t1: null,
    nm1_t2: "", nm2_t2: "", nm3_t2: "", rpt_t2: "", mt_t2: null, mtf_t2: null,
    nm1_t3: "", nm2_t3: "", nm3_t3: "", rpt_t3: "", mt_t3: null, mtf_t3: null,
    ma: null, pf: "", maf: null, rcf: "", tgf: "0", rf: "CUR",
  });

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

        setDisciplinasDisponiveis(discData.disciplinas || []);

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

  // Etapa 2: quando uma disciplina é escolhida, busca as notas do aluno nela
  useEffect(() => {
    if (!disciplinaEscolhida || !professorId) return;

    async function carregarNotas() {
      setCarregandoNotas(true);
      setErros([]);
      setMensagem(null);

      try {
        const notasUrl = `${API_BASE}/api/teacher/notas/get?aluno=${alunoId}&turma=${disciplinaEscolhida.turma_id}&professor=${professorId}`;
        const notasRes = await fetch(notasUrl);

        if (!notasRes.ok) throw new Error(`Falha ao buscar notas (status ${notasRes.status})`);
        const notasData = await notasRes.json();

        setAluno(notasData.aluno);
        setNotas((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(notasData.notas).map(([k, v]) => [
              k,
              v ?? (typeof prev[k] === "string" ? "" : null),
            ])
          ),
        }));
      } catch (error) {
        setErros([`Erro ao carregar notas: ${error.message}`]);
      } finally {
        setCarregandoNotas(false);
      }
    }

    carregarNotas();
  }, [disciplinaEscolhida, professorId, alunoId]);

  function handleChange(campo, valor) {
    if (valor === "" || (/^\d{0,2}(\.\d{0,2})?$/.test(valor) && Number(valor) <= 10)) {
      setNotas((prev) => ({ ...prev, [campo]: valor }));
    }
  }

  async function handleSalvar() {
    setSaving(true);
    setMensagem(null);
    setErros([]);

    try {
      const res = await fetch(`${API_BASE}/api/teacher/notas/salvar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aluno: alunoId,
          turma: disciplinaEscolhida.turma_id,
          professor: professorId,
          notas,
        }),
      });

      if (!res.ok) {
        const corpoErro = await res.text();
        throw new Error(`Falha ao salvar (status ${res.status}) - ${corpoErro}`);
      }

      const data = await res.json();

      if (data.erros?.length) setErros(data.erros);
      else setMensagem("Notas salvas com sucesso.");

      if (data.notas) {
        setNotas((prev) => ({ ...prev, ...data.notas }));
      }
    } catch (error) {
      setErros([`Erro ao salvar as notas: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <p className={styles.loadingText}>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.content}>
        <main className={layoutStyles.main}>
          <div className={styles.wrapper}>
            <h1 className={styles.title}>
              Lançar notas — {aluno?.nome_completo || "Aluno"}
            </h1>

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
                        setAluno(null);
                        setMensagem(null);
                        setErros([]);
                      }}
                    >
                      Trocar disciplina
                    </button>
                  )}
                </div>

                {carregandoNotas ? (
                  <p className={styles.subtitle}>Carregando notas...</p>
                ) : (
                  aluno && (
                    <>
                      {mensagem && <p className={styles.mensagemSucesso}>{mensagem}</p>}

                      <div className={styles.listaWrapper}>
                        <div className={styles.listaHeader}>
                          <span className={styles.colLabel}>Trimestre</span>
                          <span className={styles.colLabel}>NM1</span>
                          <span className={styles.colLabel}>NM2</span>
                          <span className={styles.colLabel}>NM3</span>
                          <span className={styles.colLabel}>MT</span>
                          <span className={styles.colLabel}>RPT</span>
                          <span className={styles.colLabel}>MTF</span>
                        </div>

                        {[1, 2, 3].map((t) => (
                          <div key={t} className={styles.listaRow}>
                            <span className={styles.rowLabel}>{t}º Trimestre</span>

                            <input
                              type="text"
                              inputMode="decimal"
                              className={`${styles.input} ${corDaNota(notas[`nm1_t${t}`])}`}
                              value={notas[`nm1_t${t}`]}
                              onChange={(e) => handleChange(`nm1_t${t}`, e.target.value)}
                            />
                            <input
                              type="text"
                              inputMode="decimal"
                              className={`${styles.input} ${corDaNota(notas[`nm2_t${t}`])}`}
                              value={notas[`nm2_t${t}`]}
                              onChange={(e) => handleChange(`nm2_t${t}`, e.target.value)}
                            />
                            <input
                              type="text"
                              inputMode="decimal"
                              className={`${styles.input} ${corDaNota(notas[`nm3_t${t}`])}`}
                              value={notas[`nm3_t${t}`]}
                              onChange={(e) => handleChange(`nm3_t${t}`, e.target.value)}
                            />
                            <span className={`${styles.calculadoBadge} ${corDaNota(notas[`mt_t${t}`])}`}>
                              {notas[`mt_t${t}`] ?? "—"}
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              className={`${styles.input} ${corDaNota(notas[`rpt_t${t}`])}`}
                              value={notas[`rpt_t${t}`]}
                              onChange={(e) => handleChange(`rpt_t${t}`, e.target.value)}
                            />
                            <span className={`${styles.calculadoBadge} ${corDaNota(notas[`mtf_t${t}`])}`}>
                              {notas[`mtf_t${t}`] ?? "—"}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className={styles.resultadoWrapper}>
                        <h3 className={styles.resultadoTitle}>Resultado Anual / Final</h3>

                        <div className={styles.resultadoGrid}>
                          <div className={styles.resultadoItem}>
                            <span className={styles.resultadoLabel}>MA</span>
                            <span className={`${styles.calculadoBadge} ${corDaNota(notas.ma)}`}>{notas.ma ?? "—"}</span>
                          </div>

                          <div className={styles.resultadoItem}>
                            <span className={styles.resultadoLabel}>PF</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              className={`${styles.input} ${corDaNota(notas.pf)}`}
                              value={notas.pf}
                              onChange={(e) => handleChange("pf", e.target.value)}
                            />
                          </div>

                          <div className={styles.resultadoItem}>
                            <span className={styles.resultadoLabel}>MAF</span>
                            <span className={`${styles.calculadoBadge} ${corDaNota(notas.maf)}`}>{notas.maf ?? "—"}</span>
                          </div>

                          <div className={styles.resultadoItem}>
                            <span className={styles.resultadoLabel}>RCF</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              className={`${styles.input} ${corDaNota(notas.rcf)}`}
                              value={notas.rcf}
                              onChange={(e) => handleChange("rcf", e.target.value)}
                            />
                          </div>

                          <div className={styles.resultadoItem}>
                            <span className={styles.resultadoLabel}>TGF</span>
                            <input
                              type="number"
                              min="0"
                              className={styles.input}
                              value={notas.tgf}
                              onChange={(e) => setNotas((prev) => ({ ...prev, tgf: e.target.value }))}
                            />
                          </div>

                          <div className={styles.resultadoItem}>
                            <span className={styles.resultadoLabel}>RF</span>
                            <select
                              className={styles.select}
                              value={notas.rf}
                              onChange={(e) => setNotas((prev) => ({ ...prev, rf: e.target.value }))}
                            >
                              {RF_OPCOES.map(([valor, label]) => (
                                <option key={valor} value={valor}>{label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <button onClick={handleSalvar} disabled={saving} className={styles.botaoSalvar}>
                        {saving ? "Salvando..." : "Salvar notas"}
                      </button>
                    </>
                  )
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import layoutStyles from "../../../../page.module.css";
// import styles from "./notas.module.css";

// const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

// const RF_OPCOES = [
//   ["CUR", "Cursando"], ["AP", "Aprovado"], ["RE", "Reprovado"],
//   ["DE", "Desistente"], ["FA", "Falecido"], ["AB", "Abandono"],
//   ["TR", "Transferido"], ["CA", "Cancelado"], ["TT", "Troca de Turma"],
//   ["TO", "Transferido Outros"], ["PP", "Para Progressão"], ["ND", "Não Definido"],
// ];

// // Retorna a classe de cor com base no valor da nota: menor que 6 = vermelho, 6+ = azul
// function corDaNota(valor) {
//   if (valor === "" || valor === null || valor === undefined) return "";
//   const numero = Number(valor);
//   if (Number.isNaN(numero)) return "";
//   return numero < 6 ? styles.notaBaixa : styles.notaAlta;
// }

// export default function LancarNotasPage() {
//   const { turmaId, alunoId } = useParams();
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [aluno, setAluno] = useState(null);
//   const [professorId, setProfessorId] = useState(null);
//   const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState([]);
//   const [disciplinaEscolhida, setDisciplinaEscolhida] = useState(null);
//   const [carregandoNotas, setCarregandoNotas] = useState(false);
//   const [mensagem, setMensagem] = useState(null);
//   const [erros, setErros] = useState([]);

//   const [notas, setNotas] = useState({
//     nm1_t1: "", nm2_t1: "", nm3_t1: "", rpt_t1: "", mt_t1: null, mtf_t1: null,
//     nm1_t2: "", nm2_t2: "", nm3_t2: "", rpt_t2: "", mt_t2: null, mtf_t2: null,
//     nm1_t3: "", nm2_t3: "", nm3_t3: "", rpt_t3: "", mt_t3: null, mtf_t3: null,
//     ma: null, pf: "", maf: null, rcf: "", tgf: "0", rf: "CUR",
//   });

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

//         const discRes = await fetch(
//           `${API_BASE}/api/teacher/turma/disciplinas?turma=${turmaId}&professor=${profId}`
//         );
//         if (!discRes.ok) throw new Error(`Falha ao buscar disciplinas (status ${discRes.status})`);
//         const discData = await discRes.json();

//         setDisciplinasDisponiveis(discData.disciplinas || []);

//         if (discData.disciplinas?.length === 1) {
//           setDisciplinaEscolhida(discData.disciplinas[0]);
//         }
//       } catch (error) {
//         setErros([`Erro ao carregar disciplinas da turma: ${error.message}`]);
//       } finally {
//         setLoading(false);
//       }
//     }

//     init();
//   }, [turmaId, router]);

//   useEffect(() => {
//     if (!disciplinaEscolhida || !professorId) return;

//     async function carregarNotas() {
//       setCarregandoNotas(true);
//       setErros([]);
//       setMensagem(null);

//       try {
//         const notasUrl = `${API_BASE}/api/teacher/notas/get?aluno=${alunoId}&turma=${disciplinaEscolhida.turma_id}&professor=${professorId}`;
//         const notasRes = await fetch(notasUrl);

//         if (!notasRes.ok) throw new Error(`Falha ao buscar notas (status ${notasRes.status})`);
//         const notasData = await notasRes.json();

//         setAluno(notasData.aluno);
//         setNotas((prev) => ({
//           ...prev,
//           ...Object.fromEntries(
//             Object.entries(notasData.notas).map(([k, v]) => {
//               // Campos editáveis (inputs) precisam de string vazia no lugar de null.
//               // Campos calculados (mt_/mtf_/ma/maf) podem permanecer null, pois
//               // são exibidos como texto ("—"), não como value de input.
//               const camposCalculados = ["mt_t1", "mtf_t1", "mt_t2", "mtf_t2", "mt_t3", "mtf_t3", "ma", "maf"];
//               if (camposCalculados.includes(k)) {
//                 return [k, v];
//               }
//               return [k, v ?? ""];
//             })
//           ),
//         }));
//       } catch (error) {
//         setErros([`Erro ao carregar notas: ${error.message}`]);
//       } finally {
//         setCarregandoNotas(false);
//       }
//     }

//     carregarNotas();
//   }, [disciplinaEscolhida, professorId, alunoId]);

//   function handleChange(campo, valor) {
//     if (valor === "" || (/^\d{0,2}(\.\d{0,2})?$/.test(valor) && Number(valor) <= 10)) {
//       setNotas((prev) => ({ ...prev, [campo]: valor }));
//     }
//   }

//   async function handleSalvar() {
//     setSaving(true);
//     setMensagem(null);
//     setErros([]);

//     try {
//       const res = await fetch(`${API_BASE}/api/teacher/notas/salvar`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           aluno: alunoId,
//           turma: disciplinaEscolhida.turma_id,
//           professor: professorId,
//           notas,
//         }),
//       });

//       if (!res.ok) {
//         const corpoErro = await res.text();
//         throw new Error(`Falha ao salvar (status ${res.status}) - ${corpoErro}`);
//       }

//       const data = await res.json();

//       if (data.erros?.length) setErros(data.erros);
//       else setMensagem("Notas salvas com sucesso.");

//       if (data.notas) {
//         setNotas((prev) => ({ ...prev, ...data.notas }));
//       }
//     } catch (error) {
//       setErros([`Erro ao salvar as notas: ${error.message}`]);
//     } finally {
//       setSaving(false);
//     }
//   }

//   if (loading) {
//     return (
//       <div className={layoutStyles.page}>
//         <p className={styles.loadingText}>Carregando...</p>
//       </div>
//     );
//   }

//   return (
//     <div className={layoutStyles.page}>
//       <div className={layoutStyles.content}>
//         <main className={layoutStyles.main}>
//           <div className={styles.wrapper}>
//             <h1 className={styles.title}>
//               Lançar notas — {aluno?.nome_completo || "Aluno"}
//             </h1>

//             {erros.length > 0 && (
//               <ul className={styles.listaErros}>
//                 {erros.map((e, i) => (
//                   <li key={i}>{e}</li>
//                 ))}
//               </ul>
//             )}

//             {!disciplinaEscolhida ? (
//               <>
//                 <p className={styles.subtitle}>Escolha a disciplina para lançar as notas.</p>

//                 {disciplinasDisponiveis.length === 0 ? (
//                   <p className={styles.subtitle}>Nenhuma disciplina encontrada para esta turma.</p>
//                 ) : (
//                   <div className={styles.disciplinasEscolha}>
//                     {disciplinasDisponiveis.map((d) => (
//                       <button
//                         key={d.turma_id}
//                         className={styles.disciplinaBotao}
//                         onClick={() => setDisciplinaEscolhida(d)}
//                       >
//                         {d.disciplina}
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </>
//             ) : (
//               <>
//                 <div className={styles.disciplinaAtual}>
//                   <span className={styles.disciplinaAtualLabel}>
//                     Disciplina: <strong>{disciplinaEscolhida.disciplina}</strong>
//                   </span>

//                   {disciplinasDisponiveis.length > 1 && (
//                     <button
//                       className={styles.trocarBotao}
//                       onClick={() => {
//                         setDisciplinaEscolhida(null);
//                         setAluno(null);
//                         setMensagem(null);
//                         setErros([]);
//                       }}
//                     >
//                       Trocar disciplina
//                     </button>
//                   )}
//                 </div>

//                 {carregandoNotas ? (
//                   <p className={styles.subtitle}>Carregando notas...</p>
//                 ) : (
//                   aluno && (
//                     <>
//                       {mensagem && <p className={styles.mensagemSucesso}>{mensagem}</p>}

//                       <div className={styles.listaWrapper}>
//                         <div className={styles.listaHeader}>
//                           <span className={styles.colLabel}>Trimestre</span>
//                           <span className={styles.colLabel}>NM1</span>
//                           <span className={styles.colLabel}>NM2</span>
//                           <span className={styles.colLabel}>NM3</span>
//                           <span className={styles.colLabel}>MT</span>
//                           <span className={styles.colLabel}>RPT</span>
//                           <span className={styles.colLabel}>MTF</span>
//                         </div>

//                         {[1, 2, 3].map((t) => (
//                           <div key={t} className={styles.listaRow}>
//                             <span className={styles.rowLabel}>{t}º Trimestre</span>

//                             <input
//                               type="text"
//                               inputMode="decimal"
//                               className={`${styles.input} ${corDaNota(notas[`nm1_t${t}`])}`}
//                               value={notas[`nm1_t${t}`] ?? ""}
//                               onChange={(e) => handleChange(`nm1_t${t}`, e.target.value)}
//                             />
//                             <input
//                               type="text"
//                               inputMode="decimal"
//                               className={`${styles.input} ${corDaNota(notas[`nm2_t${t}`])}`}
//                               value={notas[`nm2_t${t}`] ?? ""}
//                               onChange={(e) => handleChange(`nm2_t${t}`, e.target.value)}
//                             />
//                             <input
//                               type="text"
//                               inputMode="decimal"
//                               className={`${styles.input} ${corDaNota(notas[`nm3_t${t}`])}`}
//                               value={notas[`nm3_t${t}`] ?? ""}
//                               onChange={(e) => handleChange(`nm3_t${t}`, e.target.value)}
//                             />
//                             <span className={`${styles.calculadoBadge} ${corDaNota(notas[`mt_t${t}`])}`}>
//                               {notas[`mt_t${t}`] ?? "—"}
//                             </span>
//                             <input
//                               type="text"
//                               inputMode="decimal"
//                               className={`${styles.input} ${corDaNota(notas[`rpt_t${t}`])}`}
//                               value={notas[`rpt_t${t}`] ?? ""}
//                               onChange={(e) => handleChange(`rpt_t${t}`, e.target.value)}
//                             />
//                             <span className={`${styles.calculadoBadge} ${corDaNota(notas[`mtf_t${t}`])}`}>
//                               {notas[`mtf_t${t}`] ?? "—"}
//                             </span>
//                           </div>
//                         ))}
//                       </div>

//                       <div className={styles.resultadoWrapper}>
//                         <h3 className={styles.resultadoTitle}>Resultado Anual / Final</h3>

//                         <div className={styles.resultadoGrid}>
//                           <div className={styles.resultadoItem}>
//                             <span className={styles.resultadoLabel}>MA</span>
//                             <span className={`${styles.calculadoBadge} ${corDaNota(notas.ma)}`}>{notas.ma ?? "—"}</span>
//                           </div>

//                           <div className={styles.resultadoItem}>
//                             <span className={styles.resultadoLabel}>PF</span>
//                             <input
//                               type="text"
//                               inputMode="decimal"
//                               className={`${styles.input} ${corDaNota(notas.pf)}`}
//                               value={notas.pf ?? ""}
//                               onChange={(e) => handleChange("pf", e.target.value)}
//                             />
//                           </div>

//                           <div className={styles.resultadoItem}>
//                             <span className={styles.resultadoLabel}>MAF</span>
//                             <span className={`${styles.calculadoBadge} ${corDaNota(notas.maf)}`}>{notas.maf ?? "—"}</span>
//                           </div>

//                           <div className={styles.resultadoItem}>
//                             <span className={styles.resultadoLabel}>RCF</span>
//                             <input
//                               type="text"
//                               inputMode="decimal"
//                               className={`${styles.input} ${corDaNota(notas.rcf)}`}
//                               value={notas.rcf ?? ""}
//                               onChange={(e) => handleChange("rcf", e.target.value)}
//                             />
//                           </div>

//                           <div className={styles.resultadoItem}>
//                             <span className={styles.resultadoLabel}>TGF</span>
//                             <input
//                               type="number"
//                               min="0"
//                               className={styles.input}
//                               value={notas.tgf ?? "0"}
//                               onChange={(e) => setNotas((prev) => ({ ...prev, tgf: e.target.value }))}
//                             />
//                           </div>

//                           <div className={styles.resultadoItem}>
//                             <span className={styles.resultadoLabel}>RF</span>
//                             <select
//                               className={styles.select}
//                               value={notas.rf ?? "CUR"}
//                               onChange={(e) => setNotas((prev) => ({ ...prev, rf: e.target.value }))}
//                             >
//                               {RF_OPCOES.map(([valor, label]) => (
//                                 <option key={valor} value={valor}>{label}</option>
//                               ))}
//                             </select>
//                           </div>
//                         </div>
//                       </div>

//                       <button onClick={handleSalvar} disabled={saving} className={styles.botaoSalvar}>
//                         {saving ? "Salvando..." : "Salvar notas"}
//                       </button>
//                     </>
//                   )
//                 )}
//               </>
//             )}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }