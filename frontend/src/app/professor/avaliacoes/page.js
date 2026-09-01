// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import styles from "./page.module.css";

// const API_BASE = "https://humble-spoon-4j654556jr9vf5qp6-8000.app.github.dev";

// export default function AvaliacoesPage() {
//   const [avaliacoes, setAvaliacoes] = useState([]);
//   const [carregando, setCarregando] = useState(true);
//   const [erro, setErro] = useState(null);

//   useEffect(() => {
//     async function carregar() {
//       try {
//         const res = await fetch(`${API_BASE}/api/teacher/avaliacoes`, {
//           credentials: "include",
//         });
//         if (!res.ok) {
//           const corpoErro = await res.text();
//           let message = "Erro ao carregar avaliações";
//           try {
//             message = JSON.parse(corpoErro).message || message;
//           } catch {}
//           throw new Error(message);
//         }
//         const data = await res.json();
//         setAvaliacoes(data.avaliacoes);
//       } catch (e) {
//         setErro(e.message);
//       } finally {
//         setCarregando(false);
//       }
//     }
//     carregar();
//   }, []);

//   async function emitirPdf(id, titulo) {
//     try {
//       const res = await fetch(`${API_BASE}/api/teacher/avaliacoes/${id}/pdf`, {
//         credentials: "include",
//       });
//       if (!res.ok) throw new Error("Erro ao gerar PDF");
//       const blob = await res.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `${titulo}.pdf`;
//       a.click();
//       window.URL.revokeObjectURL(url);
//     } catch (e) {
//       alert(e.message);
//     }
//   }

//   return (
//     <div className={styles.container}>
//       <div className={styles.header}>
//         <h1>Avaliações</h1>
//         <Link href="/professor/avaliacoes/novo" className={styles.novoBotao}>
//           + Nova avaliação
//         </Link>
//       </div>

//       {carregando && <p>Carregando...</p>}
//       {erro && <p className={styles.erro}>{erro}</p>}

//       <div className={styles.grid}>
//         {avaliacoes.map((a) => (
//           <div key={a.id} className={styles.card}>
//             <Link href={`/professor/avaliacoes/${a.id}`} className={styles.cardLink}>
//               <h3>{a.titulo}</h3>
//               <p>{a.disciplina} — Turma {a.turma}</p>
//               <p className={styles.meta}>{a.total_questoes} questões · {a.data}</p>
//             </Link>
//             <button className={styles.pdfBotao} onClick={() => emitirPdf(a.id, a.titulo)}>
//               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
//                 <path d="M14 2v6h6" />
//                 <path d="M12 18v-6" />
//                 <path d="M9 15l3 3 3-3" />
//               </svg>
//               Emitir PDF
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://humble-spoon-4j654556jr9vf5qp6-8000.app.github.dev";

export default function AvaliacoesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [erros, setErros] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/professor/login");
          return;
        }

        const res = await fetch(`${API_BASE}/api/teacher/avaliacoes`);
        if (!res.ok) {
          const corpoErro = await res.text();
          let msg = `Falha ao buscar avaliações (status ${res.status})`;
          try {
            const json = JSON.parse(corpoErro);
            if (json.message) msg = json.message;
          } catch { }
          throw new Error(msg);
        }

        const data = await res.json();
        setAvaliacoes(data.avaliacoes || []);
      } catch (error) {
        setErros([`Erro ao carregar avaliações: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

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

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
          <Link href="/professor" className={styles.inicioBotao}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
              <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
              <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
            </svg>
            Início
          </Link>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>Avaliações</h1>
              <p className={styles.subtitle}>Gerencie as avaliações criadas por você.</p>
            </div>
            <Link href="/professor/avaliacoes/novo" className={styles.novoBotao}>
              + Nova avaliação
            </Link>
          </div>

          {erros.length > 0 && (
            <ul className={styles.listaErros}>
              {erros.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}

          {avaliacoes.length === 0 ? (
            <p className={styles.vazio}>Nenhuma avaliação cadastrada ainda.</p>
          ) : (
            <div className={styles.grid}>
              {avaliacoes.map((a) => (
                <div key={a.id} className={styles.card}>
                  <Link href={`/professor/avaliacoes/${a.id}`} className={styles.cardLink}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitulo}>{a.titulo}</h3>
                      <span className={styles.cardData}>
                        {new Date(a.data).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className={styles.cardLinha}>
                      <strong>Disciplina:</strong> {a.disciplina}
                    </p>
                    <p className={styles.cardLinha}>
                      <strong>Turma:</strong> {a.turma}
                    </p>
                    <p className={styles.cardMeta}>{a.total_questoes} questões</p>
                  </Link>

                  <button className={styles.pdfBotao} onClick={() => emitirPdf(a.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                      <path d="M5 3h9l5 5v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z" />
                      <path d="M9 12h6" />
                      <path d="M9 16h6" />
                    </svg>
                    Emitir PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
        );
}