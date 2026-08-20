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

  const horariosPorDia = {};
  for (const dia of DIAS) horariosPorDia[dia.key] = [];
  for (const h of horarios) {
    if (horariosPorDia[h.dia_semana]) horariosPorDia[h.dia_semana].push(h);
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
        </div>

        {horarios.length === 0 ? (
          <p className={styles.vazio}>
            Nenhum horário cadastrado para esta turma ainda.
          </p>
        ) : (
          <div className={styles.grade}>
            {DIAS.map((dia) => (
              <div key={dia.key} className={styles.coluna}>
                <p className={styles.colunaTitulo}>{dia.label}</p>

                {horariosPorDia[dia.key].length === 0 ? (
                  <p className={styles.colunaVazia}>—</p>
                ) : (
                  <div className={styles.aulas}>
                    {horariosPorDia[dia.key].map((h) => (
                      <div key={h.id} className={styles.aula}>
                        <span className={styles.aulaHorario}>
                          {h.hora_inicio} – {h.hora_fim}
                        </span>
                        <span className={styles.aulaDisciplina}>{h.disciplina}</span>
                        <span className={styles.aulaProfessor}>{h.professor}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}