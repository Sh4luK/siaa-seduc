"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "http://127.0.0.1:8000";

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

const INTERVALOS = [
  { inicio: "10:10", fim: "10:30", label: "Intervalo" },
  { inicio: "12:10", fim: "13:10", label: "Almoço" },
  { inicio: "16:10", fim: "16:30", label: "Intervalo" },
];

function gerarSlots(inicio, fim) {
  const inicioMin = paraMinutos(inicio);
  const fimMin = paraMinutos(fim);

  const intervalosNoRange = INTERVALOS.map((iv) => ({
    inicio: paraMinutos(iv.inicio),
    fim: paraMinutos(iv.fim),
    label: iv.label,
  })).filter((iv) => iv.inicio >= inicioMin && iv.fim <= fimMin);

  const slots = [];
  let atual = inicioMin;

  while (atual < fimMin) {
    const intervalo = intervalosNoRange.find((iv) => iv.inicio === atual);
    if (intervalo) {
      slots.push({
        inicio: paraHHMM(intervalo.inicio),
        fim: paraHHMM(intervalo.fim),
        tipo: "intervalo",
        label: intervalo.label,
      });
      atual = intervalo.fim;
      continue;
    }

    const proximoIntervalo = intervalosNoRange
      .map((iv) => iv.inicio)
      .filter((ini) => ini > atual)
      .sort((a, b) => a - b)[0];

    const limite = proximoIntervalo !== undefined ? Math.min(proximoIntervalo, fimMin) : fimMin;
    const proximo = Math.min(atual + 60, limite);

    slots.push({ inicio: paraHHMM(atual), fim: paraHHMM(proximo), tipo: "aula" });
    atual = proximo;
  }

  return slots;
}

// const TEMPLATES = {
//   SERIE_1: { label: "1ª Série", inicio: "07:10", fim: "16:10" },
//   SERIE_2: { label: "2ª Série", inicio: "07:10", fim: "16:10" },
//   SERIE_3_MANHA: { label: "3ª Série — Manhã", inicio: "07:10", fim: "12:30" },
//   SERIE_3_TARDE: { label: "3ª Série — Tarde", inicio: "13:10", fim: "18:30" },
// };

// function determinarTemplate(turma) {
//   const texto = `${turma?.nome_turma || ""} ${turma?.etapa || ""}`.toUpperCase();

//   const eh1 = texto.includes("1ª") || texto.includes("1A") || texto.includes("1º");
//   const eh2 = texto.includes("2ª") || texto.includes("2A") || texto.includes("2º");
//   const eh3 = texto.includes("3ª") || texto.includes("3A") || texto.includes("3º");
//   const ehManha = texto.includes("MANH");
//   const ehTarde = texto.includes("TARDE");

//   if (eh3 && ehTarde) return TEMPLATES.SERIE_3_TARDE;
//   if (eh3 && ehManha) return TEMPLATES.SERIE_3_MANHA;
//   if (eh3) return TEMPLATES.SERIE_1; // 3ª sem manhã/tarde identificado, cai no padrão integral
//   if (eh2) return TEMPLATES.SERIE_2;
//   if (eh1) return TEMPLATES.SERIE_1;

//   // Qualquer série não identificada cai no padrão genérico
//   return TEMPLATES.SERIE_1;
// }

function normalizar(txt) {
  return (txt || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toUpperCase();
}

function detectarSerie(compact) {
  if (compact.includes("1ASERIE") || compact.includes("1SERIE") || compact.includes("1OSERIE")) return 1;
  if (compact.includes("2ASERIE") || compact.includes("2SERIE") || compact.includes("2OSERIE")) return 2;
  if (compact.includes("3ASERIE") || compact.includes("3SERIE") || compact.includes("3OSERIE")) return 3;
  return null;
}

// function determinarTemplate(turma) {
//   const texto = normalizar(`${turma?.nome_turma || ""} ${turma?.etapa || ""}`);
//   const compact = texto.replace(/[^A-Z0-9]/g, ""); // remove espaços/pontuação, só letras e números
//   const serie = detectarSerie(compact);

//   const ehParcial = texto.includes("PARCIAL");
//   const ehManha = texto.includes("MANHA");
//   const ehTarde = texto.includes("TARDE");

//   if (serie === 3 && ehParcial && ehTarde) {
//     return { label: "3ª Série — Parcial (Tarde)", inicio: "13:10", fim: "18:30" };
//   }
//   if (serie === 3 && ehParcial && ehManha) {
//     return { label: "3ª Série — Parcial (Manhã)", inicio: "07:10", fim: "12:10" };
//   }

//   const labelPorSerie = { 1: "1ª Série", 2: "2ª Série", 3: "3ª Série" };
//   return {
//     label: labelPorSerie[serie] || "Padrão",
//     inicio: "07:10",
//     fim: "16:10",
//   };
// }

function determinarTemplate(turma) {
  const nomeTurma = (turma?.nome_turma || "").toUpperCase();
  const etapa = (turma?.etapa || "").toUpperCase();
  const texto = `${nomeTurma} ${etapa}`;

  // Extrai o número da série a partir de "3ª SERIE", "2a SERIE", "1º SÉRIE" etc.
  const matchSerie = texto.match(/([123])\s*[ºªO]?\s*S[EÉ]RIE/);
  const serie = matchSerie ? Number(matchSerie[1]) : null;

  const ehParcial = texto.includes("PARCIAL");

  // O turno vem como um segmento isolado (M, T ou I) entre hifens, ex:
  // "EMTPADM-EMP-3ª SERIE - PARCIAL-M-A" -> segmentos: [..., "PARCIAL", "M", "A"]
  const segmentos = nomeTurma.split("-").map((s) => s.trim()).filter(Boolean);
  const turnoSegmentos = segmentos.filter((s) => s === "M" || s === "T" || s === "I");
  const turno = turnoSegmentos.length > 0 ? turnoSegmentos[turnoSegmentos.length - 1] : null;

  if (serie === 3 && ehParcial && turno === "T") {
    return { label: "3ª Série — Parcial (Tarde)", inicio: "13:10", fim: "18:30" };
  }
  if (serie === 3 && ehParcial && turno === "M") {
    return { label: "3ª Série — Parcial (Manhã)", inicio: "07:10", fim: "12:10" };
  }

  const labelPorSerie = { 1: "1ª Série", 2: "2ª Série", 3: "3ª Série" };
  return {
    label: labelPorSerie[serie] || "Padrão",
    inicio: "07:10",
    fim: "16:10",
  };
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
          } catch { }
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
          <div className={styles.headerAcoes}>
            <span className={styles.turnoBadge}>{template.label} · {template.inicio}–{template.fim}</span>
            <Link href={`/coordenacao/horarios/${turmaId}/editar`} className={styles.editarBotao}>
              Editar horário
            </Link>
          </div>
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
              {slots.map((slot) => {
                if (slot.tipo === "intervalo") {
                  return (
                    <tr key={slot.inicio} className={styles.linhaIntervalo}>
                      <td className={styles.celulaHora}>
                        {slot.inicio} – {slot.fim}
                      </td>
                      <td className={styles.celulaIntervalo} colSpan={DIAS.length}>
                        {slot.label}
                      </td>
                    </tr>
                  );
                }

                return (
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}