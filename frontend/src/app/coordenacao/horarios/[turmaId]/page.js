// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import Image from "next/image";
// import logo from "@/assets/logo.png";
// import styles from "./page.module.css";

// const API_BASE = "https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev";

// const DIAS = [
//   { key: "SEG", label: "Segunda" },
//   { key: "TER", label: "Terça" },
//   { key: "QUA", label: "Quarta" },
//   { key: "QUI", label: "Quinta" },
//   { key: "SEX", label: "Sexta" },
// ];

// export default function HorarioTurmaPage() {
//   const { turmaId } = useParams();
//   const router = useRouter();
//   const nomeTurma = decodeURIComponent(turmaId);

//   const [authenticated, setAuthenticated] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [turma, setTurma] = useState(null);
//   const [horarios, setHorarios] = useState([]);
//   const [erro, setErro] = useState("");

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

//         const res = await fetch(
//           `${API_BASE}/api/coordenacao/turmas/${encodeURIComponent(nomeTurma)}/horarios`
//         );

//         if (!res.ok) {
//           const corpoErro = await res.text();
//           let mensagem = "Não foi possível carregar os horários.";
//           try {
//             const json = JSON.parse(corpoErro);
//             if (json?.message) mensagem = json.message;
//           } catch {}
//           throw new Error(mensagem);
//         }

//         const data = await res.json();
//         setTurma(data.turma);
//         setHorarios(data.horarios || []);
//       } catch (error) {
//         setErro(error.message || "Erro ao carregar horários.");
//       } finally {
//         setLoading(false);
//       }
//     }

//     if (turmaId) init();
//   }, [router, turmaId, nomeTurma]);

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

//   if (erro) {
//     return (
//       <div className={styles.page}>
//         <div className={styles.wrapper}>
//           <p className={styles.estadoErro}>{erro}</p>
//           <Link href="/coordenacao/horarios" className={styles.voltarLink}>
//             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <path d="M15 6l-6 6l6 6" />
//             </svg>
//             Horários
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   const horariosPorDia = {};
//   for (const dia of DIAS) horariosPorDia[dia.key] = [];
//   for (const h of horarios) {
//     if (horariosPorDia[h.dia_semana]) horariosPorDia[h.dia_semana].push(h);
//   }

//   return (
//     <div className={styles.page}>
//       <div className={styles.wrapper}>
//         <Link href="/coordenacao/horarios" className={styles.voltarLink}>
//           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M15 6l-6 6l6 6" />
//           </svg>
//           Horários
//         </Link>

//         <div className={styles.headerRow}>
//           <div>
//             <h1 className={styles.title}>{turma?.nome_turma}</h1>
//             <p className={styles.subtitle}>
//               {turma?.etapa} · {turma?.escola}
//             </p>
//           </div>
//         </div>

//         {horarios.length === 0 ? (
//           <p className={styles.vazio}>
//             Nenhum horário cadastrado para esta turma ainda.
//           </p>
//         ) : (
//           <div className={styles.grade}>
//             {DIAS.map((dia) => (
//               <div key={dia.key} className={styles.coluna}>
//                 <p className={styles.colunaTitulo}>{dia.label}</p>

//                 {horariosPorDia[dia.key].length === 0 ? (
//                   <p className={styles.colunaVazia}>—</p>
//                 ) : (
//                   <div className={styles.aulas}>
//                     {horariosPorDia[dia.key].map((h) => (
//                       <div key={h.id} className={styles.aula}>
//                         <span className={styles.aulaHorario}>
//                           {h.hora_inicio} – {h.hora_fim}
//                         </span>
//                         <span className={styles.aulaDisciplina}>{h.disciplina}</span>
//                         <span className={styles.aulaProfessor}>{h.professor}</span>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev";

const DIAS = [
  { key: "SEG", label: "Segunda" },
  { key: "TER", label: "Terça" },
  { key: "QUA", label: "Quarta" },
  { key: "QUI", label: "Quinta" },
  { key: "SEX", label: "Sexta" },
];

// --- Templates de horário (blocos de 1h, último bloco pode ser parcial) ---
function paraMinutos(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function paraHHMM(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function gerarSlots(inicio, fim) {
  const inicioMin = paraMinutos(inicio);
  const fimMin = paraMinutos(fim);
  const slots = [];
  let atual = inicioMin;

  while (atual < fimMin) {
    const proximo = Math.min(atual + 60, fimMin);
    slots.push({ inicio: paraHHMM(atual), fim: paraHHMM(proximo) });
    atual = proximo;
  }

  return slots;
}

const TEMPLATES = {
  SERIE_1: { label: "1ª Série", inicio: "07:10", fim: "16:10" },
  SERIE_2: { label: "2ª Série", inicio: "07:10", fim: "16:10" },
  SERIE_3_MANHA: { label: "3ª Série — Manhã", inicio: "07:10", fim: "12:30" },
  SERIE_3_TARDE: { label: "3ª Série — Tarde", inicio: "13:10", fim: "18:30" },
};

function determinarTemplate(turma) {
  const texto = `${turma?.nome_turma || ""} ${turma?.etapa || ""}`.toUpperCase();

  const eh1 = texto.includes("1ª") || texto.includes("1A") || texto.includes("1º");
  const eh2 = texto.includes("2ª") || texto.includes("2A") || texto.includes("2º");
  const eh3 = texto.includes("3ª") || texto.includes("3A") || texto.includes("3º");
  const ehManha = texto.includes("MANH");
  const ehTarde = texto.includes("TARDE");

  if (eh3 && ehTarde) return TEMPLATES.SERIE_3_TARDE;
  if (eh3 && ehManha) return TEMPLATES.SERIE_3_MANHA;
  if (eh3) return TEMPLATES.SERIE_1; // 3ª sem manhã/tarde identificado, cai no padrão integral
  if (eh2) return TEMPLATES.SERIE_2;
  if (eh1) return TEMPLATES.SERIE_1;

  // Qualquer série não identificada cai no padrão genérico
  return TEMPLATES.SERIE_1;
}

export default function HorarioTurmaPage() {
  const { turmaId } = useParams();
  const router = useRouter();
  const nomeTurma = decodeURIComponent(turmaId);

  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [turma, setTurma] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [erro, setErro] = useState("");

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

        const res = await fetch(
          `${API_BASE}/api/coordenacao/turmas/${encodeURIComponent(nomeTurma)}/horarios`
        );

        if (!res.ok) {
          const corpoErro = await res.text();
          let mensagem = "Não foi possível carregar os horários.";
          try {
            const json = JSON.parse(corpoErro);
            if (json?.message) mensagem = json.message;
          } catch {}
          throw new Error(mensagem);
        }

        const data = await res.json();
        setTurma(data.turma);
        setHorarios(data.horarios || []);
      } catch (error) {
        setErro(error.message || "Erro ao carregar horários.");
      } finally {
        setLoading(false);
      }
    }

    if (turmaId) init();
  }, [router, turmaId, nomeTurma]);

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

  if (erro) {
    return (
      <div className={styles.page}>
        <div className={styles.wrapper}>
          <p className={styles.estadoErro}>{erro}</p>
          <Link href="/coordenacao/horarios" className={styles.voltarLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6l6 6" />
            </svg>
            Horários
          </Link>
        </div>
      </div>
    );
  }

  const template = determinarTemplate(turma);
  const slots = gerarSlots(template.inicio, template.fim);

  // Indexa as aulas cadastradas por "dia|hora_inicio" pra encaixar na célula certa.
  const aulasPorCelula = {};
  for (const h of horarios) {
    const chave = `${h.dia_semana}|${h.hora_inicio}`;
    aulasPorCelula[chave] = h;
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <Link href="/coordenacao/horarios" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Horários
        </Link>

        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>{turma?.nome_turma}</h1>
            <p className={styles.subtitle}>
              {turma?.etapa} · {turma?.escola}
            </p>
          </div>
          <span className={styles.turnoBadge}>{template.label} · {template.inicio}–{template.fim}</span>
        </div>

        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th className={styles.colHora}>Horário</th>
                {DIAS.map((dia) => (
                  <th key={dia.key}>{dia.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.inicio}>
                  <td className={styles.celulaHora}>
                    {slot.inicio} – {slot.fim}
                  </td>
                  {DIAS.map((dia) => {
                    const aula = aulasPorCelula[`${dia.key}|${slot.inicio}`];
                    return (
                      <td key={dia.key} className={styles.celula}>
                        {aula ? (
                          <div className={styles.aula}>
                            <span className={styles.aulaDisciplina}>{aula.disciplina}</span>
                            <span className={styles.aulaProfessor}>{aula.professor}</span>
                          </div>
                        ) : (
                          <span className={styles.celulaVazia}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}