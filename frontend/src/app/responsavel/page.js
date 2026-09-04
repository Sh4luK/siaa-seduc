// "use client";

// import { useEffect, useState, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import styles from "./page.module.css";

// const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

// const STATUS_LABEL = {
//   PENDENTE: "Pendente",
//   APROVADO: "Aprovado",
//   RECUSADO: "Recusado",
// };

// function formatarData(iso) {
//   return new Date(iso).toLocaleDateString("pt-BR");
// }

// export default function ResponsavelPainelPage() {
//   const [authenticated, setAuthenticated] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [nomeCompleto, setNomeCompleto] = useState("");

//   const [vinculos, setVinculos] = useState([]);
//   const [carregando, setCarregando] = useState(true);
//   const [erro, setErro] = useState(null);

//   const [mostrarForm, setMostrarForm] = useState(false);
//   // const [alunoNome, setAlunoNome] = useState("");
//   const [buscaAluno, setBuscaAluno] = useState("");
//   const [dropdownAberto, setDropdownAberto] = useState(false);
//   const [alunosEncontrados, setAlunosEncontrados] = useState([]);
//   const [alunoSelecionado, setAlunoSelecionado] = useState(null); // { id, nome_completo }
//   const [buscando, setBuscando] = useState(false);
//   const [parentesco, setParentesco] = useState("");
//   const [enviando, setEnviando] = useState(false);

//   const router = useRouter();

//   const carregarVinculos = useCallback(async () => {
//     setCarregando(true);
//     try {
//       const res = await fetch(`${API_BASE}/api/responsavel/vinculos`);
//       if (!res.ok) throw new Error(`Falha ao buscar vínculos (status ${res.status})`);
//       const data = await res.json();
//       setVinculos(data.vinculos || []);
//     } catch (error) {
//       setErro(error.message);
//     } finally {
//       setCarregando(false);
//     }
//   }, []);

//   useEffect(() => {
//     async function init() {
//       try {
//         const authRes = await fetch(`${API_BASE}/api/responsavel/auth`);
//         const authData = await authRes.json();

//         if (!authData.return) {
//           router.push("/responsavel/login");
//           return;
//         }
//         setAuthenticated(true);
//         setNomeCompleto(authData.responsavel?.nome_completo || "");
//         setLoading(false);
//         await carregarVinculos();
//       } catch (error) {
//         setErro(`Erro ao carregar dados: ${error.message}`);
//         setLoading(false);
//       }
//     }
//     init();
//   }, [router, carregarVinculos]);

//   async function handleSolicitar(e) {
//     e.preventDefault();
//     setErro(null);

//     if (!alunoNome.trim() || !parentesco.trim()) {
//       setErro("Preencha o nome do aluno e o parentesco.");
//       return;
//     }

//     setEnviando(true);
//     try {
//       const res = await fetch(`${API_BASE}/api/responsavel/vinculos/solicitar`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           aluno_nome_completo: alunoNome.trim(),
//           parentesco: parentesco.trim(),
//         }),
//       });
//       const data = await res.json();
//       if (!res.ok) {
//         throw new Error(data.detail || "Não foi possível enviar a solicitação.");
//       }
//       setAlunoNome("");
//       setParentesco("");
//       setMostrarForm(false);
//       await carregarVinculos();
//     } catch (e2) {
//       setErro(e2.message);
//     } finally {
//       setEnviando(false);
//     }
//   }

//   if (loading) {
//     return (
//       <div className={styles.pageLoading}>
//         <div className={styles.cardLoading}>
//           <p className={styles.subtituloLoading}>Verificando credenciais…</p>
//         </div>
//       </div>
//     );
//   }

//   if (authenticated !== true) return null;

//   const firstName = nomeCompleto.split(" ")[0];

//   return (
//     <div className={styles.page}>
//       <div className={styles.topBar}>
//         Governo do Estado do Piauí — Secretaria de Estado da Educação
//       </div>

//       <div className={styles.wrapper}>
//         <div className={styles.headerRow}>
//           <div>
//             <h1 className={styles.title}>Olá, {firstName}</h1>
//             <p className={styles.subtitle}>Acompanhamento dos seus dependentes.</p>
//           </div>
//           <button className={styles.novoBotao} onClick={() => setMostrarForm((v) => !v)}>
//             {mostrarForm ? "Cancelar" : "+ Vincular aluno"}
//           </button>
//         </div>

//         {erro && <div className={styles.erro}>{erro}</div>}

//         {mostrarForm && (
//           <form onSubmit={handleSolicitar} className={styles.form}>
//             <div className={styles.linhaDupla}>
//               <div className={styles.campo}>
//                 <label className={styles.label}>Nome completo do aluno</label>
//                 <input
//                   className={styles.input}
//                   value={alunoNome}
//                   onChange={(e) => setAlunoNome(e.target.value)}
//                   placeholder="Digite exatamente como está no cadastro escolar"
//                 />
//               </div>
//               <div className={styles.campo}>
//                 <label className={styles.label}>Parentesco</label>
//                 <input
//                   className={styles.input}
//                   placeholder="Ex: Mãe, Pai, Avó..."
//                   value={parentesco}
//                   onChange={(e) => setParentesco(e.target.value)}
//                 />
//               </div>
//             </div>
//             <button type="submit" disabled={enviando} className={styles.enviarBtn}>
//               {enviando ? "Enviando..." : "Enviar solicitação"}
//             </button>
//           </form>
//         )}

//         {carregando ? (
//           <p className={styles.subtitle}>Carregando...</p>
//         ) : vinculos.length === 0 ? (
//           <p className={styles.vazio}>
//             Você ainda não está vinculado a nenhum aluno. Use o botão acima pra solicitar.
//           </p>
//         ) : (
//           <ul className={styles.lista}>
//             {vinculos.map((v) => (
//               <li key={v.id} className={styles.card}>
//                 <div className={styles.cardInfo}>
//                   <div className={styles.cardTopo}>
//                     <p className={styles.cardNome}>{v.aluno_nome}</p>
//                     <span
//                       className={
//                         v.status === "APROVADO"
//                           ? styles.badgeAprovado
//                           : v.status === "RECUSADO"
//                             ? styles.badgeRecusado
//                             : styles.badgePendente
//                       }
//                     >
//                       {STATUS_LABEL[v.status]}
//                     </span>
//                   </div>
//                   <p className={styles.cardMeta}>
//                     {v.parentesco} · Turma: {v.aluno_turma || "—"} · solicitado em {formatarData(v.data_solicitacao)}
//                   </p>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </div>
//   );
// }


"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

const STATUS_LABEL = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
};

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function ResponsavelPainelPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");

  const [vinculos, setVinculos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [parentesco, setParentesco] = useState("");
  const [enviando, setEnviando] = useState(false);

  // busca de aluno
  const [buscaAluno, setBuscaAluno] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [alunosEncontrados, setAlunosEncontrados] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null); // { id, nome_completo }
  const [buscando, setBuscando] = useState(false);

  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  const router = useRouter();

  const carregarVinculos = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch(`${API_BASE}/api/responsavel/vinculos`);
      if (!res.ok) throw new Error(`Falha ao buscar vínculos (status ${res.status})`);
      const data = await res.json();
      setVinculos(data.vinculos || []);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/responsavel/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/responsavel/login");
          return;
        }
        setAuthenticated(true);
        setNomeCompleto(authData.responsavel?.nome_completo || "");
        setLoading(false);
        await carregarVinculos();
      } catch (error) {
        setErro(`Erro ao carregar dados: ${error.message}`);
        setLoading(false);
      }
    }
    init();
  }, [router, carregarVinculos]);

  // busca de alunos com debounce
  useEffect(() => {
    if (alunoSelecionado) return;
    if (buscaAluno.trim().length < 3) {
      setAlunosEncontrados([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/responsavel/alunos/buscar?q=${encodeURIComponent(buscaAluno)}`
        );
        if (res.ok) {
          const data = await res.json();
          setAlunosEncontrados(data.alunos || []);
        }
      } catch {
        // falha silenciosa na busca
      } finally {
        setBuscando(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [buscaAluno, alunoSelecionado]);

  // fecha o dropdown ao clicar fora
  useEffect(() => {
    function aoClicarFora(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  function selecionarAluno(aluno) {
    setAlunoSelecionado(aluno);
    setBuscaAluno(aluno.nome_completo);
    setDropdownAberto(false);
  }

  function limparAlunoSelecionado() {
    setAlunoSelecionado(null);
    setBuscaAluno("");
  }

  async function handleSolicitar(e) {
    e.preventDefault();
    setErro(null);

    if (!alunoSelecionado || !parentesco.trim()) {
      setErro("Selecione o aluno e preencha o parentesco.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/responsavel/vinculos/solicitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aluno_id: alunoSelecionado.id,
          parentesco: parentesco.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Não foi possível enviar a solicitação.");
      }
      limparAlunoSelecionado();
      setParentesco("");
      setMostrarForm(false);
      await carregarVinculos();
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <p className={styles.subtituloLoading}>Verificando credenciais…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  const firstName = nomeCompleto.split(" ")[0];

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        Governo do Estado do Piauí — Secretaria de Estado da Educação
      </div>

      <div className={styles.wrapper}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Olá, {firstName}</h1>
            <p className={styles.subtitle}>Acompanhamento dos seus dependentes.</p>
          </div>
          <button
            className={styles.novoBotao}
            onClick={() => {
              setMostrarForm((v) => !v);
              if (mostrarForm) {
                limparAlunoSelecionado();
                setParentesco("");
              }
            }}
          >
            {mostrarForm ? "Cancelar" : "+ Vincular aluno"}
          </button>
        </div>

        {erro && <div className={styles.erro}>{erro}</div>}

        {mostrarForm && (
          <form onSubmit={handleSolicitar} className={styles.form}>
            <div className={styles.linhaDupla}>
              <div className={styles.campo} ref={wrapperRef}>
                <label className={styles.label}>Nome completo do aluno</label>

                <div className={styles.buscaWrapper}>
                  <svg
                    className={styles.buscaIcone}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="10" cy="10" r="7" />
                    <line x1="21" y1="21" x2="15" y2="15" />
                  </svg>
                  <input
                    type="text"
                    value={buscaAluno}
                    onChange={(e) => {
                      setBuscaAluno(e.target.value);
                      setAlunoSelecionado(null);
                      setDropdownAberto(true);
                    }}
                    onFocus={() => setDropdownAberto(true)}
                    placeholder="Digite o nome do aluno..."
                    className={styles.buscaInput}
                    autoComplete="off"
                  />
                  {alunoSelecionado && (
                    <button
                      type="button"
                      onClick={limparAlunoSelecionado}
                      className={styles.limparBtn}
                      aria-label="Limpar seleção"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>

                {dropdownAberto && !alunoSelecionado && buscaAluno.trim().length >= 3 && (
                  <div className={styles.dropdown}>
                    {buscando && <div className={styles.dropdownVazio}>Buscando...</div>}
                    {!buscando && alunosEncontrados.length === 0 && (
                      <div className={styles.dropdownVazio}>Nenhum aluno encontrado.</div>
                    )}
                    {!buscando &&
                      alunosEncontrados.map((a) => (
                        <button
                          type="button"
                          key={a.id}
                          onClick={() => selecionarAluno(a)}
                          className={styles.dropdownItem}
                        >
                          {a.nome_completo}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div className={styles.campo}>
                <label className={styles.label}>Parentesco</label>
                <select
                  className={styles.input}
                  value={parentesco}
                  onChange={(e) => setParentesco(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="Mãe">Mãe</option>
                  <option value="Pai">Pai</option>
                  <option value="Avó">Avó</option>
                  <option value="Avô">Avô</option>
                  <option value="Tia">Tia</option>
                  <option value="Tio">Tio</option>
                  <option value="Irmã(o)">Irmã(o)</option>
                  <option value="Responsável legal">Responsável legal</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={enviando} className={styles.enviarBtn}>
              {enviando ? "Enviando..." : "Enviar solicitação"}
            </button>
          </form>
        )}

        {carregando ? (
          <p className={styles.subtitle}>Carregando...</p>
        ) : vinculos.length === 0 ? (
          <p className={styles.vazio}>
            Você ainda não está vinculado a nenhum aluno. Use o botão acima pra solicitar.
          </p>
        ) : (
          <ul className={styles.lista}>
            {vinculos.map((v) => (
              <li key={v.id} className={styles.card}>
                <div className={styles.cardInfo}>
                  <div className={styles.cardTopo}>
                    <p className={styles.cardNome}>{v.aluno_nome}</p>
                    <span
                      className={
                        v.status === "APROVADO"
                          ? styles.badgeAprovado
                          : v.status === "RECUSADO"
                          ? styles.badgeRecusado
                          : styles.badgePendente
                      }
                    >
                      {STATUS_LABEL[v.status]}
                    </span>
                  </div>
                  <p className={styles.cardMeta}>
                    {v.parentesco} · Turma: {v.aluno_turma || "—"} · solicitado em{" "}
                    {formatarData(v.data_solicitacao)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}