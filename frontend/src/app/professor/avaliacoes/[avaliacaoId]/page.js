// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import styles from "./page.module.css";

// const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

// export default function VisualizarAvaliacaoPage() {
//   const { avaliacaoId } = useParams();
//   const router = useRouter();
//   const [avaliacao, setAvaliacao] = useState(null);
//   const [erro, setErro] = useState(null);
//   const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

//   useEffect(() => {
//     async function carregar() {
//       try {
//         const res = await fetch(`${API_BASE}/api/teacher/avaliacoes/${avaliacaoId}`, {
//           credentials: "include",
//         });
//         if (!res.ok) {
//           const corpoErro = await res.text();
//           let message = "Erro ao carregar avaliação";
//           try {
//             message = JSON.parse(corpoErro).message || message;
//           } catch {}
//           throw new Error(message);
//         }
//         setAvaliacao(await res.json());
//       } catch (e) {
//         setErro(e.message);
//       }
//     }
//     carregar();
//   }, [avaliacaoId]);

//   async function excluir() {
//     try {
//       const res = await fetch(`${API_BASE}/api/teacher/avaliacoes/${avaliacaoId}`, {
//         method: "DELETE",
//         credentials: "include",
//       });
//       if (!res.ok) throw new Error("Erro ao excluir");
//       router.push("/professor/avaliacoes");
//     } catch (e) {
//       setErro(e.message);
//     }
//   }

//   if (erro) return <p className={styles.erro}>{erro}</p>;
//   if (!avaliacao) return <p>Carregando...</p>;

//   return (
//     <div className={styles.container}>
//       <div className={styles.header}>
//         <div>
//           <h1>{avaliacao.titulo}</h1>
//           <p className={styles.meta}>
//             {avaliacao.disciplina} — Turma {avaliacao.turma} · {avaliacao.data}
//           </p>
//         </div>
//         <div className={styles.acoes}>
//           <button
//             className={styles.editarBotao}
//             onClick={() => router.push(`/professor/avaliacoes/${avaliacaoId}/editar`)}
//           >
//             Editar
//           </button>

//           {!confirmandoExclusao ? (
//             <button className={styles.excluirBotao} onClick={() => setConfirmandoExclusao(true)}>
//               Excluir
//             </button>
//           ) : (
//             <div className={styles.confirmacao}>
//               <span>Confirmar exclusão?</span>
//               <button onClick={excluir}>Sim</button>
//               <button onClick={() => setConfirmandoExclusao(false)}>Não</button>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className={styles.questoesLista}>
//         {avaliacao.questoes.map((q, index) => (
//           <div key={q.id} className={styles.questaoCard}>
//             <div className={styles.questaoHeader}>
//               <span>Questão {index + 1}</span>
//               <span className={styles.tipoBadge}>{q.tipo === "OBJETIVA" ? "Objetiva" : "Subjetiva"}</span>
//             </div>
//             <p>{q.enunciado}</p>
//             {q.imagem && <img src={q.imagem} alt="" className={styles.imagemPreview} />}
//             {q.tipo === "OBJETIVA" && (
//               <ul className={styles.alternativas}>
//                 {q.alternativas.map((alt) => (
//                   <li key={alt.letra} className={alt.correta ? styles.correta : ""}>
//                     {alt.letra}) {alt.texto}
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";
import Image from "next/image";
import logo from "@/assets/logo.png";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function VisualizarAvaliacaoPage() {
  const { avaliacaoId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [avaliacao, setAvaliacao] = useState(null);
  const [erros, setErros] = useState([]);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/professor/login");
          return;
        }

        const res = await fetch(`${API_BASE}/api/teacher/avaliacoes/${avaliacaoId}`);
        if (!res.ok) {
          const corpoErro = await res.text();
          let msg = `Falha ao carregar avaliação (status ${res.status})`;
          try {
            const json = JSON.parse(corpoErro);
            if (json.message) msg = json.message;
          } catch { }
          throw new Error(msg);
        }

        setAvaliacao(await res.json());
      } catch (error) {
        setErros([`Erro ao carregar avaliação: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [avaliacaoId, router]);

  async function excluir() {
    setExcluindo(true);
    try {
      const res = await fetch(`${API_BASE}/api/teacher/avaliacoes/${avaliacaoId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Falha ao excluir (status ${res.status})`);
      router.push("/professor/avaliacoes");
    } catch (error) {
      setErros([`Erro ao excluir avaliação: ${error.message}`]);
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  }

  // async function emitirPdf() {
  //   try {
  //     const res = await fetch(`${API_BASE}/api/teacher/avaliacoes/${avaliacaoId}/pdf`);
  //     if (!res.ok) throw new Error(`Falha ao gerar PDF (status ${res.status})`);
  //     const blob = await res.blob();
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = `${avaliacao.titulo}.pdf`;
  //     a.click();
  //     window.URL.revokeObjectURL(url);
  //   } catch (error) {
  //     setErros([`Erro ao emitir PDF: ${error.message}`]);
  //   }
  // }

  function emitirPdf(id) {
    window.open(`${API_BASE}/api/teacher/avaliacoes/${id}/pdf`, "_blank");
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

  if (erros.length > 0 && !avaliacao) {
    return (
      <div className={styles.page}>
        <div className={styles.wrapper}>
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <button className={styles.voltarBotao} onClick={() => router.push("/professor/avaliacoes")}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>{avaliacao.titulo}</h1>
            <p className={styles.subtitle}>
              {avaliacao.disciplina} — Turma {avaliacao.turma} · {avaliacao.data}
            </p>
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

        <div className={styles.acoesBarra}>
          <button
            className={styles.acaoBotaoSecundario}
            onClick={() => emitirPdf(avaliacaoId)}
          >
            Emitir PDF
          </button>

          {/* aguardando referência de /coordenacao/advertencias para "Emitir boletim" */}

          <button
            className={styles.acaoBotaoSecundario}
            onClick={() => router.push(`/professor/avaliacoes/${avaliacaoId}/editar`)}
          >
            Editar
          </button>

          {!confirmandoExclusao ? (
            <button className={styles.removerVinculoBotao} onClick={() => setConfirmandoExclusao(true)}>
              Excluir
            </button>
          ) : (
            <div className={styles.confirmacaoExclusao}>
              <span>Confirmar exclusão?</span>
              <button onClick={excluir} disabled={excluindo}>
                {excluindo ? "Excluindo..." : "Sim"}
              </button>
              <button onClick={() => setConfirmandoExclusao(false)} disabled={excluindo}>
                Não
              </button>
            </div>
          )}
        </div>

        <div className={styles.secaoDivisor}>
          <h2 className={styles.secaoTitulo}>Questões</h2>
          <p className={styles.secaoSubtitulo}>{avaliacao.questoes.length} questões nesta avaliação.</p>
        </div>

        {avaliacao.questoes.map((q, index) => (
          <div key={q.id} className={styles.vinculoCard}>
            <div className={styles.vinculoHeader}>
              <span className={styles.vinculoNumero}>Questão {index + 1}</span>
              <span className={q.tipo === "OBJETIVA" ? styles.tipoAtivo : styles.tipoBotao}>
                {q.tipo === "OBJETIVA" ? "Objetiva" : "Subjetiva"}
              </span>
            </div>

            <p className={styles.enunciadoTexto}>{q.enunciado}</p>

            {q.imagem && (
              <img src={q.imagem} alt="" className={styles.imagemPreview} />
            )}

            {q.tipo === "OBJETIVA" && (
              <div className={styles.alternativas}>
                {q.alternativas.map((alt) => (
                  <div
                    key={alt.letra}
                    className={alt.correta ? styles.alternativaCorreta : styles.alternativaLinhaView}
                  >
                    <span className={styles.alternativaLetra}>{alt.letra})</span>
                    <span>{alt.texto}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}