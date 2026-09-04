"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import layoutStyles from "../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function diasNoMes(ano, mes) { return new Date(ano, mes, 0).getDate(); }
function diaSemanaDoPrimeiro(ano, mes) { return new Date(ano, mes - 1, 1).getDay(); }

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
        <Link key={aba.key} href={aba.href} className={ativa === aba.key ? layoutStyles.tabLinkActive : layoutStyles.tabLink}>{aba.label}</Link>
      ))}
    </div>
  );
}

export default function FrequenciaAlunoResponsavelPage() {
  const router = useRouter();
  const params = useParams();
  const alunoId = params.alunoId;

  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  const carregarFrequencia = useCallback(async (m, a) => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`${API_BASE}/api/responsavel/alunos/${alunoId}/frequencia?mes=${m}&ano=${a}`);
      if (res.status === 403) throw new Error("Você não tem acesso aprovado a este aluno.");
      if (!res.ok) throw new Error(`Falha ao buscar frequência (status ${res.status})`);
      setDados(await res.json());
      setDiaSelecionado(null);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, [alunoId]);

  useEffect(() => {
    async function init() {
      const authRes = await fetch(`${API_BASE}/api/responsavel/auth`);
      const authData = await authRes.json();
      if (!authData.return) {
        router.push("/responsavel/login");
        return;
      }
      await carregarFrequencia(mes, ano);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function trocarMes(delta) {
    let novoMes = mes + delta, novoAno = ano;
    if (novoMes > 12) { novoMes = 1; novoAno += 1; }
    else if (novoMes < 1) { novoMes = 12; novoAno -= 1; }
    setMes(novoMes); setAno(novoAno);
    carregarFrequencia(novoMes, novoAno);
  }

  const totalDias = diasNoMes(ano, mes);
  const offset = diaSemanaDoPrimeiro(ano, mes);
  const mapaDias = {};
  (dados?.dias || []).forEach((d) => { mapaDias[d.data] = d; });

  const celulas = [];
  for (let i = 0; i < offset; i++) celulas.push(null);
  for (let dia = 1; dia <= totalDias; dia++) {
    const dataStr = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    celulas.push({ dia, dataStr, info: mapaDias[dataStr] || null });
  }
  const diaInfoSelecionado = diaSelecionado ? mapaDias[diaSelecionado] : null;

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.topBar}>Governo do Estado do Piauí — Secretaria de Estado da Educação</div>
      <div className={layoutStyles.wrapper}>
        <Link href="/responsavel" className={layoutStyles.voltarLink}>← Painel</Link>
        <TabsResponsavel alunoId={alunoId} ativa="frequencia" />

        <h1 className={layoutStyles.title}>Frequência</h1>
        <p className={layoutStyles.subtitle}>{dados?.aluno?.nome_completo}</p>

        {erro && <p className={styles.erro}>{erro}</p>}

        {!erro && (
          <>
            <div className={styles.resumoRow}>
              <div className={styles.resumoCard}><span className={styles.resumoValor}>{dados?.total_registros ?? "—"}</span><span className={styles.resumoLabel}>Aulas no mês</span></div>
              <div className={`${styles.resumoCard} ${styles.resumoVerde}`}><span className={styles.resumoValor}>{dados?.total_presencas ?? "—"}</span><span className={styles.resumoLabel}>Presenças</span></div>
              <div className={`${styles.resumoCard} ${styles.resumoVermelho}`}><span className={styles.resumoValor}>{dados?.total_faltas ?? "—"}</span><span className={styles.resumoLabel}>Faltas</span></div>
              <div className={styles.resumoCard}><span className={styles.resumoValor}>{dados?.percentual_presenca != null ? `${dados.percentual_presenca}%` : "—"}</span><span className={styles.resumoLabel}>Presença no mês</span></div>
            </div>

            <div className={styles.calendarioHeader}>
              <button className={styles.navBtn} onClick={() => trocarMes(-1)} aria-label="Mês anterior">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <span className={styles.mesAtual}>{MESES[mes - 1]} de {ano}</span>
              <button className={styles.navBtn} onClick={() => trocarMes(1)} aria-label="Próximo mês">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>

            {carregando ? (
              <p className={styles.subtitle}>Carregando...</p>
            ) : (
              <div className={styles.calendarioWrapper}>
                <div className={styles.diasSemanaHeader}>
                  {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d) => <span key={d} className={styles.diaSemanaLabel}>{d}</span>)}
                </div>
                <div className={styles.grade}>
                  {celulas.map((c, i) => {
                    if (!c) return <div key={`vazio-${i}`} className={styles.celulaVazia} />;
                    let classeStatus = styles.semRegistro;
                    if (c.info) {
                      if (c.info.situacao === "presente") classeStatus = styles.diaPresente;
                      else if (c.info.situacao === "falta_parcial") classeStatus = styles.diaFaltaParcial;
                      else classeStatus = styles.diaFalta;
                    }
                    return (
                      <button
                        key={c.dataStr}
                        className={`${styles.celulaDia} ${classeStatus} ${diaSelecionado === c.dataStr ? styles.celulaSelecionada : ""}`}
                        onClick={() => c.info && setDiaSelecionado(c.dataStr)}
                        disabled={!c.info}
                      >
                        {c.dia}
                      </button>
                    );
                  })}
                </div>
                <div className={styles.legenda}>
                  <span className={styles.legendaItem}><span className={`${styles.legendaBolinha} ${styles.diaPresente}`} /> Presença total</span>
                  <span className={styles.legendaItem}><span className={`${styles.legendaBolinha} ${styles.diaFaltaParcial}`} /> Falta parcial</span>
                  <span className={styles.legendaItem}><span className={`${styles.legendaBolinha} ${styles.diaFalta}`} /> Falta total</span>
                </div>
              </div>
            )}

            {diaInfoSelecionado && (
              <div className={styles.detalheDia}>
                <div className={styles.detalheHeader}>Detalhes de {diaSelecionado.split("-").reverse().join("/")}</div>
                <ul className={styles.detalheLista}>
                  {diaInfoSelecionado.aulas.map((a, i) => (
                    <li key={i} className={styles.detalheItem}>
                      <span>{a.disciplina || "Disciplina"}</span>
                      <span className={a.presente ? styles.badgePresente : styles.badgeFalta}>{a.presente ? "Presente" : "Falta"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}