"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import layoutStyles from "../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function corDaNota(valor) {
  if (valor === "" || valor === null || valor === undefined) return "";
  const numero = Number(valor);
  if (Number.isNaN(numero)) return "";
  return numero < 6 ? styles.notaBaixa : styles.notaAlta;
}

function TabsResponsavel({ alunoId, ativa }) {
  const abas = [
    { key: "painel", label: "Painel", href: `/responsavel/${alunoId}` },
    { key: "boletim", label: "Boletim", href: `/responsavel/${alunoId}/boletim` },
    { key: "frequencia", label: "Frequência", href: `/responsavel/${alunoId}/frequencia` },
    { key: "horario", label: "Horário", href: `/responsavel/${alunoId}/horario` },
    { key: "mensagem", label: "Mensagens", href: `/responsavel/${alunoId}/mensagem` },
    { key: "comunicados", label: "Comunicados", href: `/responsavel/${alunoId}/comunicados` },
    { key: "advertencias", label: "Advertências", href: `/responsavel/${alunoId}/advertencias` },
    { key: "avaliacoes", label: "Avaliações", href: `/responsavel/${alunoId}/avaliacoes` },
    { key: "calendario", label: "Calendário", href: `/responsavel/${alunoId}/calendario` },
  ];
  return (
    <div className={layoutStyles.tabsRow}>
      {abas.map((aba) => (
        <Link key={aba.key} href={aba.href} className={ativa === aba.key ? layoutStyles.tabLinkActive : layoutStyles.tabLink}>
          {aba.label}
        </Link>
      ))}
    </div>
  );
}

export default function BoletimAlunoResponsavelPage() {
  const router = useRouter();
  const params = useParams();
  const alunoId = params.alunoId;

  const [loading, setLoading] = useState(true);
  const [boletim, setBoletim] = useState([]);
  const [aluno, setAluno] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/responsavel/auth`);
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/responsavel/login");
          return;
        }

        const res = await fetch(`${API_BASE}/api/responsavel/alunos/${alunoId}/boletim`);
        if (res.status === 403) throw new Error("Você não tem acesso aprovado a este aluno.");
        if (!res.ok) throw new Error(`Falha ao buscar boletim (status ${res.status})`);
        const data = await res.json();
        setAluno(data.aluno);
        setBoletim(data.boletim || []);
      } catch (error) {
        setErro(error.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, alunoId]);

  if (loading) {
    return (
      <div className={layoutStyles.pageLoading}>
        <div className={layoutStyles.cardLoading}>
          <p className={layoutStyles.subtituloLoading}>Carregando boletim…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.topBar}>Governo do Estado do Piauí — Secretaria de Estado da Educação</div>
      <div className={layoutStyles.wrapper}>
        <Link href="/responsavel" className={layoutStyles.voltarLink}>← Painel</Link>
        <TabsResponsavel alunoId={alunoId} ativa="boletim" />

        {erro ? (
          <div className={layoutStyles.erro}>{erro}</div>
        ) : (
          <>
            <h1 className={layoutStyles.title}>Boletim</h1>
            <p className={layoutStyles.subtitle}>{aluno?.nome_completo} · {aluno?.turma}</p>

            {boletim.length === 0 ? (
              <p className={styles.vazio}>Nenhuma nota lançada ainda.</p>
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
                      <th rowSpan={2}>RF</th>
                    </tr>
                    <tr>
                      <th>NM1</th><th>NM2</th><th>NM3</th><th>MT</th>
                      <th>NM1</th><th>NM2</th><th>NM3</th><th>MT</th>
                      <th>NM1</th><th>NM2</th><th>NM3</th><th>MT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boletim.map((n, i) => (
                      <tr key={i}>
                        <td className={styles.stickyCol}>{n.disciplina}</td>
                        <td className={corDaNota(n.nm1_t1)}>{n.nm1_t1 ?? "—"}</td>
                        <td className={corDaNota(n.nm2_t1)}>{n.nm2_t1 ?? "—"}</td>
                        <td className={corDaNota(n.nm3_t1)}>{n.nm3_t1 ?? "—"}</td>
                        <td className={corDaNota(n.mt_t1)}>{n.mt_t1 ?? "—"}</td>
                        <td className={corDaNota(n.nm1_t2)}>{n.nm1_t2 ?? "—"}</td>
                        <td className={corDaNota(n.nm2_t2)}>{n.nm2_t2 ?? "—"}</td>
                        <td className={corDaNota(n.nm3_t2)}>{n.nm3_t2 ?? "—"}</td>
                        <td className={corDaNota(n.mt_t2)}>{n.mt_t2 ?? "—"}</td>
                        <td className={corDaNota(n.nm1_t3)}>{n.nm1_t3 ?? "—"}</td>
                        <td className={corDaNota(n.nm2_t3)}>{n.nm2_t3 ?? "—"}</td>
                        <td className={corDaNota(n.nm3_t3)}>{n.nm3_t3 ?? "—"}</td>
                        <td className={corDaNota(n.mt_t3)}>{n.mt_t3 ?? "—"}</td>
                        <td><span className={`${styles.calculadoBadge} ${corDaNota(n.ma)}`}>{n.ma ?? "—"}</span></td>
                        <td className={corDaNota(n.pf)}>{n.pf ?? "—"}</td>
                        <td><span className={`${styles.calculadoBadge} ${corDaNota(n.maf)}`}>{n.maf ?? "—"}</span></td>
                        <td>{n.rf ?? "—"}</td>
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