// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import layoutStyles from "../page.module.css";
// import styles from "./boletim.module.css";

// const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

// const RF_LABELS = {
//   CUR: "Cursando", AP: "Aprovado", RE: "Reprovado", DE: "Desistente",
//   FA: "Falecido", AB: "Abandono", TR: "Transferido", CA: "Cancelado",
//   TT: "Troca de turma", TO: "Transferido outros", PP: "Para progressão", ND: "Não definido",
// };

// export default function BoletimAlunoPage() {
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [aluno, setAluno] = useState(null);
//   const [disciplinas, setDisciplinas] = useState([]);
//   const [erros, setErros] = useState([]);

//   useEffect(() => {
//     async function init() {
//       try {
//         const authRes = await fetch(`${API_BASE}/api/student/auth`);
//         const authData = await authRes.json();

//         if (!authData.return) {
//           router.push("/aluno/login");
//           return;
//         }

//         const boletimRes = await fetch(`${API_BASE}/api/student/notas`);
//         if (!boletimRes.ok) throw new Error(`Falha ao buscar boletim (status ${boletimRes.status})`);
//         const boletimData = await boletimRes.json();

//         setAluno(boletimData.aluno);
//         setDisciplinas(boletimData.disciplinas || []);
//       } catch (error) {
//         setErros([`Erro ao carregar boletim: ${error.message}`]);
//       } finally {
//         setLoading(false);
//       }
//     }
//     init();
//   }, [router]);

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
//             <h1 className={styles.title}>Boletim escolar</h1>
//             <p className={styles.subtitle}>
//               {aluno?.nome_completo} · Turma: {aluno?.turma}
//             </p>

//             {erros.length > 0 && (
//               <ul className={styles.listaErros}>
//                 {erros.map((e, i) => (
//                   <li key={i}>{e}</li>
//                 ))}
//               </ul>
//             )}

//             {disciplinas.length === 0 ? (
//               <p className={styles.vazio}>Nenhuma nota lançada até o momento.</p>
//             ) : (
//               <div className={styles.tabelaWrapper}>
//                 <table className={styles.tabela}>
//                   <thead>
//                     <tr>
//                       <th className={styles.stickyCol} rowSpan={2}>Disciplina</th>
//                       <th colSpan={4}>1º Trimestre</th>
//                       <th colSpan={4}>2º Trimestre</th>
//                       <th colSpan={4}>3º Trimestre</th>
//                       <th rowSpan={2}>MA</th>
//                       <th rowSpan={2}>PF</th>
//                       <th rowSpan={2}>MAF</th>
//                       <th rowSpan={2}>RCF</th>
//                       <th rowSpan={2}>Faltas</th>
//                       <th rowSpan={2}>Situação</th>
//                     </tr>
//                     <tr>
//                       <th>NM1</th><th>NM2</th><th>NM3</th><th>MTF</th>
//                       <th>NM1</th><th>NM2</th><th>NM3</th><th>MTF</th>
//                       <th>NM1</th><th>NM2</th><th>NM3</th><th>MTF</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {disciplinas.map((d) => (
//                       <tr key={d.disciplina}>
//                         <td className={styles.stickyCol} title={d.disciplina}>{d.disciplina}</td>

//                         <td>{d.t1.nm1 ?? "—"}</td>
//                         <td>{d.t1.nm2 ?? "—"}</td>
//                         <td>{d.t1.nm3 ?? "—"}</td>
//                         <td className={styles.destaque}>{d.t1.mtf ?? "—"}</td>

//                         <td>{d.t2.nm1 ?? "—"}</td>
//                         <td>{d.t2.nm2 ?? "—"}</td>
//                         <td>{d.t2.nm3 ?? "—"}</td>
//                         <td className={styles.destaque}>{d.t2.mtf ?? "—"}</td>

//                         <td>{d.t3.nm1 ?? "—"}</td>
//                         <td>{d.t3.nm2 ?? "—"}</td>
//                         <td>{d.t3.nm3 ?? "—"}</td>
//                         <td className={styles.destaque}>{d.t3.mtf ?? "—"}</td>

//                         <td className={styles.destaque}>{d.ma ?? "—"}</td>
//                         <td>{d.pf ?? "—"}</td>
//                         <td className={styles.destaque}>{d.maf ?? "—"}</td>
//                         <td>{d.rcf ?? "—"}</td>
//                         <td>{d.tgf}</td>
//                         <td>
//                           <span className={`${styles.situacao} ${styles[`situacao_${d.rf}`] || ""}`}>
//                             {RF_LABELS[d.rf] || d.rf}
//                           </span>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import layoutStyles from "../page.module.css";
import styles from "./boletim.module.css";

const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

const RF_LABELS = {
  CUR: "Cursando", AP: "Aprovado", RE: "Reprovado", DE: "Desistente",
  FA: "Falecido", AB: "Abandono", TR: "Transferido", CA: "Cancelado",
  TT: "Troca de turma", TO: "Transferido outros", PP: "Para progressão", ND: "Não definido",
};

export default function BoletimAlunoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [aluno, setAluno] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [erros, setErros] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/students/auth`);
        if (!authRes.ok) throw new Error(`Falha ao autenticar (status ${authRes.status})`);
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/aluno/login");
          return;
        }

        const boletimRes = await fetch(`${API_BASE}/api/students/notas`);
        if (!boletimRes.ok) throw new Error(`Falha ao buscar boletim (status ${boletimRes.status})`);
        const boletimData = await boletimRes.json();

        setAluno(boletimData.aluno);
        setDisciplinas(boletimData.disciplinas || []);
      } catch (error) {
        setErros([`Erro ao carregar boletim: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

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
            <h1 className={styles.title}>Boletim escolar</h1>
            <p className={styles.subtitle}>
              {aluno?.nome_completo} · Turma: {aluno?.turma}
            </p>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}

            {disciplinas.length === 0 ? (
              <p className={styles.vazio}>Nenhuma nota lançada até o momento.</p>
            ) : (
              <div className={styles.tabelaWrapper}>
                <table className={styles.tabela}>
                  <thead>
                    <tr>
                      <th className={styles.stickyCol} rowSpan={2}>Disciplina</th>
                      <th colSpan={4}>1º Trimestre</th>
                      <th colSpan={4}>2º Trimestre</th>
                      <th colSpan={4}>3º Trimestre</th>
                      <th rowSpan={2}>MA</th>
                      <th rowSpan={2}>PF</th>
                      <th rowSpan={2}>MAF</th>
                      <th rowSpan={2}>RCF</th>
                      <th rowSpan={2}>Faltas</th>
                      <th rowSpan={2}>Situação</th>
                    </tr>
                    <tr>
                      <th>NM1</th><th>NM2</th><th>NM3</th><th>MTF</th>
                      <th>NM1</th><th>NM2</th><th>NM3</th><th>MTF</th>
                      <th>NM1</th><th>NM2</th><th>NM3</th><th>MTF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disciplinas.map((d) => (
                      <tr key={d.disciplina}>
                        <td className={styles.stickyCol} title={d.disciplina}>{d.disciplina}</td>

                        <td>{d.t1.nm1 ?? "—"}</td>
                        <td>{d.t1.nm2 ?? "—"}</td>
                        <td>{d.t1.nm3 ?? "—"}</td>
                        <td className={styles.destaque}>{d.t1.mtf ?? "—"}</td>

                        <td>{d.t2.nm1 ?? "—"}</td>
                        <td>{d.t2.nm2 ?? "—"}</td>
                        <td>{d.t2.nm3 ?? "—"}</td>
                        <td className={styles.destaque}>{d.t2.mtf ?? "—"}</td>

                        <td>{d.t3.nm1 ?? "—"}</td>
                        <td>{d.t3.nm2 ?? "—"}</td>
                        <td>{d.t3.nm3 ?? "—"}</td>
                        <td className={styles.destaque}>{d.t3.mtf ?? "—"}</td>

                        <td className={styles.destaque}>{d.ma ?? "—"}</td>
                        <td>{d.pf ?? "—"}</td>
                        <td className={styles.destaque}>{d.maf ?? "—"}</td>
                        <td>{d.rcf ?? "—"}</td>
                        <td>{d.tgf}</td>
                        <td>
                          <span className={`${styles.situacao} ${styles[`situacao_${d.rf}`] || ""}`}>
                            {RF_LABELS[d.rf] || d.rf}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}