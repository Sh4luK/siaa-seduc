"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

const CAMPOS = [
  "nm1_t1", "nm2_t1", "nm3_t1", "rpt_t1",
  "nm1_t2", "nm2_t2", "nm3_t2", "rpt_t2",
  "nm1_t3", "nm2_t3", "nm3_t3", "rpt_t3",
];

function corDaNota(valor) {
  if (valor === "" || valor === null || valor === undefined) return "";
  const numero = Number(valor);
  if (Number.isNaN(numero)) return "";
  return numero < 6 ? styles.notaBaixa : styles.notaAlta;
}

export default function NotasTurmaCoordenacaoPage() {
  const { turmaId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [nomeTurma, setNomeTurma] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [professorNome, setProfessorNome] = useState("");
  const [alunos, setAlunos] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/coordenacao/login");
          return;
        }

        const res = await fetch(`${API_BASE}/api/coordenacao/notas/turma/${turmaId}`);
        if (res.status === 404) throw new Error("Turma/disciplina não encontrada.");
        if (!res.ok) throw new Error(`Falha ao buscar notas (status ${res.status})`);
        const data = await res.json();

        setNomeTurma(data.nome_turma || "");
        setDisciplina(data.disciplina || "");
        setProfessorNome(data.professor_nome || "");
        setAlunos(data.alunos || []);
      } catch (error) {
        setErro(error.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [turmaId, router]);

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.subtitle}>Carregando...</p>
      </div>
    );
  }

  const totalAprovados = alunos.filter((a) => Number(a.notas.maf ?? a.notas.ma) >= 6).length;
  const totalAbaixo = alunos.length - totalAprovados;

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <Link href="/coordenacao/notas" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Voltar para notas
        </Link>

        <div className={styles.hero}>
          <div className={styles.heroInfo}>
            <h1 className={styles.title}>{nomeTurma}</h1>
            <span className={styles.heroChip}>{disciplina}</span>
          </div>
          <span className={styles.professorNome}>Professor(a): {professorNome}</span>
        </div>

        {erro && <ul className={styles.listaErros}><li>{erro}</li></ul>}

        {!erro && (
          <>
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <span className={styles.statValor}>{alunos.length}</span>
                <span className={styles.statLabel}>Aluno(s)</span>
              </div>
              <div className={`${styles.statCard} ${styles.statVerde}`}>
                <span className={styles.statValor}>{totalAprovados}</span>
                <span className={styles.statLabel}>Com média ≥ 6</span>
              </div>
              <div className={`${styles.statCard} ${styles.statVermelho}`}>
                <span className={styles.statValor}>{totalAbaixo}</span>
                <span className={styles.statLabel}>Com média &lt; 6</span>
              </div>
            </div>

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
                      <th rowSpan={2}>MA</th>
                      <th rowSpan={2}>PF</th>
                      <th rowSpan={2}>MAF</th>
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
                          <td key={campo} className={corDaNota(aluno.notas[campo])}>
                            {aluno.notas[campo] ?? "—"}
                          </td>
                        ))}
                        <td>
                          <span className={`${styles.calculadoBadge} ${corDaNota(aluno.notas.ma)}`}>
                            {aluno.notas.ma ?? "—"}
                          </span>
                        </td>
                        <td className={corDaNota(aluno.notas.pf)}>{aluno.notas.pf ?? "—"}</td>
                        <td>
                          <span className={`${styles.calculadoBadge} ${corDaNota(aluno.notas.maf)}`}>
                            {aluno.notas.maf ?? "—"}
                          </span>
                        </td>
                        <td className={corDaNota(aluno.notas.rcf)}>{aluno.notas.rcf ?? "—"}</td>
                        <td>{aluno.notas.tgf ?? 0}</td>
                        <td>{aluno.notas.rf ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}