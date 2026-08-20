// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import Image from "next/image";
// import logo from "@/assets/logo.png";
// import styles from "./page.module.css";

// const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

// export default function NovaAdvertenciaPage() {
//   const [authenticated, setAuthenticated] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   const [tipo, setTipo] = useState("ADVERTENCIA"); // ADVERTENCIA | PENALIDADE

//   const [alunos, setAlunos] = useState([]);
//   const [alunoId, setAlunoId] = useState("");
//   const [buscaAluno, setBuscaAluno] = useState("");

//   const [professores, setProfessores] = useState([]);
//   const [professorId, setProfessorId] = useState("");

//   const [titulo, setTitulo] = useState("");
//   const [descricao, setDescricao] = useState("");
//   const [data, setData] = useState(() => new Date().toISOString().split("T")[0]);

//   const [isSuspensao, setIsSuspensao] = useState(false);
//   const [dataInicioSuspensao, setDataInicioSuspensao] = useState("");
//   const [dataTerminoSuspensao, setDataTerminoSuspensao] = useState("");

//   const [enviando, setEnviando] = useState(false);
//   const [erros, setErros] = useState([]);

//   useEffect(() => {
//     async function init() {
//       try {
//         const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
//         const authData = await authRes.json();

//         if (!authData.return) {
//           setAuthenticated(false);
//           router.push("/coordenacao/login");
//           return;
//         }
//         setAuthenticated(true);

//         const [alunosRes, profRes] = await Promise.all([
//           fetch(`${API_BASE}/api/coordenacao/alunos`),
//           fetch(`${API_BASE}/api/coordenacao/professores-simples`),
//         ]);

//         const alunosData = await alunosRes.json();
//         setAlunos(alunosData.alunos || []);

//         const profData = await profRes.json();
//         setProfessores(profData.professores || []);
//       } catch (error) {
//         setErros([`Erro ao carregar dados: ${error.message}`]);
//       } finally {
//         setLoading(false);
//       }
//     }

//     init();
//   }, [router]);

//   const alunosFiltrados = alunos.filter((a) =>
//     a.nome_completo.toLowerCase().includes(buscaAluno.toLowerCase())
//   );

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setErros([]);

//     if (!titulo.trim() || !descricao.trim()) {
//       setErros(["Preencha título e descrição."]);
//       return;
//     }

//     if (tipo === "ADVERTENCIA" && !alunoId) {
//       setErros(["Selecione o aluno."]);
//       return;
//     }

//     if (tipo === "PENALIDADE" && !professorId) {
//       setErros(["Selecione o professor."]);
//       return;
//     }

//     if (tipo === "ADVERTENCIA" && isSuspensao && (!dataInicioSuspensao || !dataTerminoSuspensao)) {
//       setErros(["Informe as datas de início e término da suspensão."]);
//       return;
//     }

//     setEnviando(true);
//     try {
//       const res = await fetch(`${API_BASE}/api/coordenacao/advertencias/criar`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           tipo,
//           titulo: titulo.trim(),
//           descricao: descricao.trim(),
//           data,
//           aluno: tipo === "ADVERTENCIA" ? alunoId : null,
//           professor: tipo === "PENALIDADE" ? professorId : null,
//           is_suspensao: tipo === "ADVERTENCIA" ? isSuspensao : false,
//           data_inicio_suspensao: tipo === "ADVERTENCIA" && isSuspensao ? dataInicioSuspensao : null,
//           data_termino_suspensao: tipo === "ADVERTENCIA" && isSuspensao ? dataTerminoSuspensao : null,
//         }),
//       });

//       const corpo = await res.text();
//       if (!res.ok) {
//         let msg = `Falha ao criar registro (status ${res.status})`;
//         try {
//           const json = JSON.parse(corpo);
//           if (json?.message) msg = json.message;
//         } catch { }
//         throw new Error(msg);
//       }

//       const data_resposta = JSON.parse(corpo);
//       router.push(`/coordenacao/advertencias/${data_resposta.advertencia.id}`);
//     } catch (error) {
//       setErros([error.message]);
//     } finally {
//       setEnviando(false);
//     }
//   }

//   if (loading) {
//     return (
//       <div className={styles.pageLoading}>
//         <div className={styles.cardLoading}>
//           <div className={styles.headerLoading}>
//             <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
//             <p className={styles.subtituloLoading}>Verificando credenciais…</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (authenticated !== true) return null;

//   return (
//     <div className={styles.page}>
//       <div className={styles.wrapper}>
//         <Link href="/coordenacao/advertencias" className={styles.voltarLink}>
//           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M15 6l-6 6l6 6" />
//           </svg>
//           Advertências
//         </Link>

//         <h1 className={styles.title}>Emitir advertência ou penalidade</h1>
//         <p className={styles.subtitle}>
//           Advertências são registradas para alunos. Penalidades, para professores.
//         </p>

//         {erros.length > 0 && (
//           <ul className={styles.listaErros}>
//             {erros.map((e, i) => (
//               <li key={i}>{e}</li>
//             ))}
//           </ul>
//         )}

//         <form onSubmit={handleSubmit} className={styles.form}>
//           <div className={styles.campo}>
//             <label className={styles.label}>Tipo de registro</label>
//             <div className={styles.tipoOpcoes}>
//               <button
//                 type="button"
//                 className={`${styles.tipoBotao} ${tipo === "ADVERTENCIA" ? styles.tipoBotaoAtivo : ""}`}
//                 onClick={() => setTipo("ADVERTENCIA")}
//               >
//                 Advertência (aluno)
//               </button>
//               <button
//                 type="button"
//                 className={`${styles.tipoBotao} ${tipo === "PENALIDADE" ? styles.tipoBotaoAtivoPenalidade : ""}`}
//                 onClick={() => setTipo("PENALIDADE")}
//               >
//                 Penalidade (professor)
//               </button>
//             </div>
//           </div>

//           {/* {tipo === "ADVERTENCIA" ? (
//             <div className={styles.campo}>
//               <label className={styles.label} htmlFor="buscaAluno">Aluno</label>
//               <input
//                 id="buscaAluno"
//                 type="text"
//                 className={styles.input}
//                 placeholder="Buscar por nome..."
//                 value={buscaAluno}
//                 onChange={(e) => setBuscaAluno(e.target.value)}
//               />
//               <select
//                 className={styles.select}
//                 value={alunoId}
//                 onChange={(e) => setAlunoId(e.target.value)}
//                 size={Math.min(6, Math.max(3, alunosFiltrados.length))}
//               >
//                 {alunosFiltrados.map((a) => (
//                   <option key={a.id} value={a.id}>
//                     {a.nome_completo} — {a.turma}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           ) : (
//             <div className={styles.campo}>
//               <label className={styles.label} htmlFor="professor">Professor</label>
//               <select
//                 id="professor"
//                 className={styles.select}
//                 value={professorId}
//                 onChange={(e) => setProfessorId(e.target.value)}
//               >
//                 <option value="">Selecione um professor</option>
//                 {professores.map((p) => (
//                   <option key={p.id} value={p.id}>{p.nome_completo}</option>
//                 ))}
//               </select>
//             </div>
//           )} */}
//           {tipo === "ADVERTENCIA" ? (
//             <div className={styles.campo}>
//               <label className={styles.label} htmlFor="buscaAluno">Aluno</label>
//               <input
//                 id="buscaAluno"
//                 type="text"
//                 className={styles.input}
//                 placeholder="Buscar por nome..."
//                 value={buscaAluno}
//                 onChange={(e) => setBuscaAluno(e.target.value)}
//               />

//               <div className={styles.alunoLista} role="listbox" aria-label="Selecione um aluno">
//                 {alunosFiltrados.length === 0 ? (
//                   <p className={styles.alunoListaVazio}>Nenhum aluno encontrado.</p>
//                 ) : (
//                   alunosFiltrados.map((a) => {
//                     const selecionado = String(alunoId) === String(a.id);
//                     return (
//                       <button
//                         key={a.id}
//                         type="button"
//                         role="option"
//                         aria-selected={selecionado}
//                         className={`${styles.alunoItem} ${selecionado ? styles.alunoItemSelecionado : ""}`}
//                         onClick={() => setAlunoId(a.id)}
//                       >
//                         <span className={styles.alunoNome}>{a.nome_completo}</span>
//                         <span className={styles.alunoTurma}>{a.turma}</span>
//                         {selecionado && (
//                           <svg className={styles.alunoCheck} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                             <path d="M5 12l5 5l10 -10" />
//                           </svg>
//                         )}
//                       </button>
//                     );
//                   })
//                 )}
//               </div>
//             </div>
//           ) : (
//             <div className={styles.campo}>
//               <label className={styles.label} htmlFor="professor">Professor</label>
//               <select
//                 id="professor"
//                 className={styles.select}
//                 value={professorId}
//                 onChange={(e) => setProfessorId(e.target.value)}
//               >
//                 <option value="">Selecione um professor</option>
//                 {professores.map((p) => (
//                   <option key={p.id} value={p.id}>{p.nome_completo}</option>
//                 ))}
//               </select>
//             </div>
//           )}

//           <div className={styles.campo}>
//             <label className={styles.label} htmlFor="data">Data</label>
//             <input
//               id="data"
//               type="date"
//               className={styles.input}
//               value={data}
//               onChange={(e) => setData(e.target.value)}
//             />
//           </div>

//           <div className={styles.campo}>
//             <label className={styles.label} htmlFor="titulo">Assunto</label>
//             <input
//               id="titulo"
//               type="text"
//               className={styles.input}
//               value={titulo}
//               onChange={(e) => setTitulo(e.target.value)}
//               placeholder="Ex: Comportamento em sala de aula"
//             />
//           </div>

//           <div className={styles.campo}>
//             <label className={styles.label} htmlFor="descricao">Descrição da ocorrência</label>
//             <textarea
//               id="descricao"
//               className={styles.textarea}
//               rows={6}
//               value={descricao}
//               onChange={(e) => setDescricao(e.target.value)}
//               placeholder="Descreva detalhadamente o ocorrido..."
//             />
//           </div>

//           <div className={styles.acoesForm}>
//             <button type="submit" className={styles.enviarBotao} disabled={enviando}>
//               {enviando ? "Emitindo..." : "Emitir registro"}
//             </button>
//             <Link href="/coordenacao/advertencias" className={styles.cancelarLink}>
//               Cancelar
//             </Link>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function NovaAdvertenciaPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [tipo, setTipo] = useState("ADVERTENCIA"); // ADVERTENCIA | PENALIDADE

  const [alunos, setAlunos] = useState([]);
  const [alunoId, setAlunoId] = useState("");
  const [buscaAluno, setBuscaAluno] = useState("");

  const [professores, setProfessores] = useState([]);
  const [professorId, setProfessorId] = useState("");

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().split("T")[0]);

  const [isSuspensao, setIsSuspensao] = useState(false);
  const [dataInicioSuspensao, setDataInicioSuspensao] = useState("");
  const [dataTerminoSuspensao, setDataTerminoSuspensao] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          setAuthenticated(false);
          router.push("/coordenacao/login");
          return;
        }
        setAuthenticated(true);

        const [alunosRes, profRes] = await Promise.all([
          fetch(`${API_BASE}/api/coordenacao/alunos`),
          fetch(`${API_BASE}/api/coordenacao/professores-simples`),
        ]);

        const alunosData = await alunosRes.json();
        setAlunos(alunosData.alunos || []);

        const profData = await profRes.json();
        setProfessores(profData.professores || []);
      } catch (error) {
        setErros([`Erro ao carregar dados: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  const alunosFiltrados = alunos.filter((a) =>
    a.nome_completo.toLowerCase().includes(buscaAluno.toLowerCase())
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setErros([]);

    if (!titulo.trim() || !descricao.trim()) {
      setErros(["Preencha título e descrição."]);
      return;
    }

    if (tipo === "ADVERTENCIA" && !alunoId) {
      setErros(["Selecione o aluno."]);
      return;
    }

    if (tipo === "PENALIDADE" && !professorId) {
      setErros(["Selecione o professor."]);
      return;
    }

    if (tipo === "ADVERTENCIA" && isSuspensao && (!dataInicioSuspensao || !dataTerminoSuspensao)) {
      setErros(["Informe as datas de início e término da suspensão."]);
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/advertencias/criar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          data,
          aluno: tipo === "ADVERTENCIA" ? alunoId : null,
          professor: tipo === "PENALIDADE" ? professorId : null,
          is_suspensao: tipo === "ADVERTENCIA" ? isSuspensao : false,
          data_inicio_suspensao: tipo === "ADVERTENCIA" && isSuspensao ? dataInicioSuspensao : null,
          data_termino_suspensao: tipo === "ADVERTENCIA" && isSuspensao ? dataTerminoSuspensao : null,
        }),
      });

      const corpo = await res.text();
      if (!res.ok) {
        let msg = `Falha ao criar registro (status ${res.status})`;
        try {
          const json = JSON.parse(corpo);
          if (json?.message) msg = json.message;
        } catch { }
        throw new Error(msg);
      }

      const data_resposta = JSON.parse(corpo);
      router.push(`/coordenacao/advertencias/${data_resposta.advertencia.id}`);
    } catch (error) {
      setErros([error.message]);
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <div className={styles.headerLoading}>
            <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
            <p className={styles.subtituloLoading}>Verificando credenciais…</p>
          </div>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <Link href="/coordenacao/advertencias" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Advertências
        </Link>

        <h1 className={styles.title}>Emitir advertência ou penalidade</h1>
        <p className={styles.subtitle}>
          Advertências são registradas para alunos. Penalidades, para professores.
        </p>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* --- Tipo de registro --- */}
          <div className={styles.campo}>
            <label className={styles.label}>Tipo de registro</label>
            <div className={styles.tipoOpcoes}>
              <button
                type="button"
                className={`${styles.tipoBotao} ${tipo === "ADVERTENCIA" ? styles.tipoBotaoAtivo : ""}`}
                onClick={() => setTipo("ADVERTENCIA")}
              >
                Advertência (aluno)
              </button>
              <button
                type="button"
                className={`${styles.tipoBotao} ${tipo === "PENALIDADE" ? styles.tipoBotaoAtivoPenalidade : ""}`}
                onClick={() => setTipo("PENALIDADE")}
              >
                Penalidade (professor)
              </button>
            </div>
          </div>

          {/* --- Alvo: aluno (lista customizada) ou professor (select) --- */}
          {tipo === "ADVERTENCIA" ? (
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="buscaAluno">Aluno</label>
              <input
                id="buscaAluno"
                type="text"
                className={styles.input}
                placeholder="Buscar por nome..."
                value={buscaAluno}
                onChange={(e) => setBuscaAluno(e.target.value)}
              />

              <div className={styles.alunoLista} role="listbox" aria-label="Selecione um aluno">
                {alunosFiltrados.length === 0 ? (
                  <p className={styles.alunoListaVazio}>Nenhum aluno encontrado.</p>
                ) : (
                  alunosFiltrados.map((a) => {
                    const selecionado = String(alunoId) === String(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        role="option"
                        aria-selected={selecionado}
                        className={`${styles.alunoItem} ${selecionado ? styles.alunoItemSelecionado : ""}`}
                        onClick={() => setAlunoId(a.id)}
                      >
                        <span className={styles.alunoNome}>{a.nome_completo}</span>
                        <span className={styles.alunoTurma}>{a.turma}</span>
                        {selecionado && (
                          <svg className={styles.alunoCheck} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12l5 5l10 -10" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="professor">Professor</label>
              <select
                id="professor"
                className={styles.select}
                value={professorId}
                onChange={(e) => setProfessorId(e.target.value)}
              >
                <option value="">Selecione um professor</option>
                {professores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome_completo}</option>
                ))}
              </select>
            </div>
          )}

          {/* --- Suspensão (só para advertência de aluno) --- */}
          {tipo === "ADVERTENCIA" && (
            <div className={styles.campo}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isSuspensao}
                  onChange={(e) => setIsSuspensao(e.target.checked)}
                />
                É uma suspensão?
              </label>

              {isSuspensao && (
                <div className={styles.suspensaoCampos}>
                  <div className={styles.campo}>
                    <label className={styles.label} htmlFor="dataInicioSuspensao">Início da suspensão</label>
                    <input
                      id="dataInicioSuspensao"
                      type="date"
                      className={styles.input}
                      value={dataInicioSuspensao}
                      onChange={(e) => setDataInicioSuspensao(e.target.value)}
                    />
                  </div>
                  <div className={styles.campo}>
                    <label className={styles.label} htmlFor="dataTerminoSuspensao">Término da suspensão</label>
                    <input
                      id="dataTerminoSuspensao"
                      type="date"
                      className={styles.input}
                      value={dataTerminoSuspensao}
                      onChange={(e) => setDataTerminoSuspensao(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- Data, título, descrição --- */}
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="data">Data</label>
            <input
              id="data"
              type="date"
              className={styles.input}
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="titulo">Assunto</label>
            <input
              id="titulo"
              type="text"
              className={styles.input}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Comportamento em sala de aula"
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="descricao">Descrição da ocorrência</label>
            <textarea
              id="descricao"
              className={styles.textarea}
              rows={6}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva detalhadamente o ocorrido..."
            />
          </div>

          <div className={styles.acoesForm}>
            <button type="submit" className={styles.enviarBotao} disabled={enviando}>
              {enviando ? "Emitindo..." : "Emitir registro"}
            </button>
            <Link href="/coordenacao/advertencias" className={styles.cancelarLink}>
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}