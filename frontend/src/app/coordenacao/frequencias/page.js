"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const API_BASE = "/backend-api";

const SITUACOES = [
  { valor: "TODAS", rotulo: "Todas" },
  { valor: "PENDENTES", rotulo: "A confirmar" },
  { valor: "CONFIRMADAS", rotulo: "Confirmadas" },
];

function formatarData(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function textoEdicao(aula) {
  if (aula.liberada_ate) return "Edição reaberta para o professor até o fim do dia";
  if (aula.edicao_professor_aberta) return "Professor ainda pode alterar (dia da aula)";
  return "Prazo do professor encerrado";
}

export default function FrequenciasCoordenacaoPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [aulas, setAulas] = useState([]);
  const [erros, setErros] = useState([]);
  const [situacao, setSituacao] = useState("PENDENTES");
  const [turma, setTurma] = useState("");
  const [professor, setProfessor] = useState("");
  const [aberta, setAberta] = useState(null); // id da aula com a lista de alunos aberta
  const [alunosPorAula, setAlunosPorAula] = useState({});
  const [salvando, setSalvando] = useState(null); // id da aula com ação em andamento

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`, { credentials: "include" });
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/coordenacao/login");
          return;
        }

        const res = await fetch(`${API_BASE}/api/coordenacao/frequencias`, { credentials: "include" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        setAulas(data.aulas || []);
      } catch (error) {
        setErros([`Erro ao carregar frequências: ${error.message}`]);
      } finally {
        setCarregando(false);
      }
    }
    init();
  }, [router]);

  const turmas = useMemo(
    () => [...new Set(aulas.map((a) => a.nome_turma))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [aulas]
  );

  const professores = useMemo(() => {
    const mapa = new Map(aulas.map((a) => [String(a.professor_id), a.professor]));
    return [...mapa.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [aulas]);

  const aulasFiltradas = aulas.filter((a) => {
    if (situacao === "PENDENTES" && a.confirmada) return false;
    if (situacao === "CONFIRMADAS" && !a.confirmada) return false;
    if (turma && a.nome_turma !== turma) return false;
    if (professor && String(a.professor_id) !== professor) return false;
    return true;
  });

  function atualizarAula(aulaAtualizada) {
    setAulas((prev) => prev.map((a) => (a.id === aulaAtualizada.id ? aulaAtualizada : a)));
  }

  async function executarAcao(aulaId, acao, corpo) {
    setSalvando(aulaId);
    setErros([]);
    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/frequencias/${aulaId}/${acao}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || `status ${res.status}`);
      atualizarAula(data.aula);
    } catch (error) {
      setErros([`Não foi possível atualizar a aula: ${error.message}`]);
    } finally {
      setSalvando(null);
    }
  }

  async function alternarAlunos(aulaId) {
    if (aberta === aulaId) {
      setAberta(null);
      return;
    }
    setAberta(aulaId);
    if (alunosPorAula[aulaId]) return;

    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/frequencias/${aulaId}`, { credentials: "include" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      setAlunosPorAula((prev) => ({ ...prev, [aulaId]: data.alunos || [] }));
    } catch (error) {
      setErros([`Erro ao carregar alunos: ${error.message}`]);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <Link href="/coordenacao" className={styles.voltarLink}>
          ‹ Organização
        </Link>

        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Frequências</h1>
            <p className={styles.subtitle}>
              Confirme as aulas dadas e reabra a edição para o professor depois do prazo.
            </p>
          </div>
        </div>

        <div className={styles.filtros}>
          <div className={styles.situacoes}>
            {SITUACOES.map((s) => (
              <button
                key={s.valor}
                type="button"
                className={`${styles.filtroBotao} ${situacao === s.valor ? styles.filtroAtivo : ""}`}
                onClick={() => setSituacao(s.valor)}
              >
                {s.rotulo}
              </button>
            ))}
          </div>

          <select
            className={styles.select}
            aria-label="Filtrar por turma"
            value={turma}
            onChange={(e) => setTurma(e.target.value)}
          >
            <option value="">Todas as turmas</option>
            {turmas.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            className={styles.select}
            aria-label="Filtrar por professor"
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
          >
            <option value="">Todos os professores</option>
            {professores.map(([id, nome]) => (
              <option key={id} value={id}>{nome}</option>
            ))}
          </select>
        </div>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        {carregando ? (
          <p className={styles.subtitle}>Carregando frequências...</p>
        ) : aulasFiltradas.length === 0 ? (
          <p className={styles.vazio}>Nenhuma frequência encontrada.</p>
        ) : (
          <ul className={styles.lista}>
            {aulasFiltradas.map((aula) => (
              <li key={aula.id} className={styles.card}>
                <div className={styles.cardTopo}>
                  <span className={styles.cardData}>{formatarData(aula.data)}</span>
                  <span className={`${styles.badge} ${aula.confirmada ? styles.badgeConfirmada : styles.badgePendente}`}>
                    {aula.confirmada ? "Aula confirmada" : "A confirmar"}
                  </span>
                </div>

                <p className={styles.cardTitulo}>
                  {aula.nome_turma} · {aula.disciplina}
                </p>
                <p className={styles.cardLinha}>Professor: {aula.professor}</p>
                {aula.conteudo_abordado && (
                  <p className={styles.cardLinha}>Conteúdo: {aula.conteudo_abordado}</p>
                )}
                <p className={styles.cardLinha}>
                  {aula.total_presentes}/{aula.total_alunos} presentes · {aula.total_faltas} falta(s)
                </p>
                <p className={styles.cardMeta}>
                  {textoEdicao(aula)}
                  {aula.confirmada && aula.confirmada_por && ` · Confirmada por ${aula.confirmada_por}`}
                </p>

                <div className={styles.acoes}>
                  <button
                    type="button"
                    className={styles.acaoSecundaria}
                    onClick={() => alternarAlunos(aula.id)}
                  >
                    {aberta === aula.id ? "Ocultar alunos" : "Ver alunos"}
                  </button>

                  <button
                    type="button"
                    className={aula.confirmada ? styles.acaoSecundaria : styles.acaoPrimaria}
                    disabled={salvando === aula.id}
                    onClick={() => executarAcao(aula.id, "confirmar", { confirmada: !aula.confirmada })}
                  >
                    {aula.confirmada ? "Desfazer confirmação" : "Confirmar aula dada"}
                  </button>

                  {aula.liberada_ate ? (
                    <button
                      type="button"
                      className={styles.acaoSecundaria}
                      disabled={salvando === aula.id}
                      onClick={() => executarAcao(aula.id, "reabrir", { reabrir: false })}
                    >
                      Fechar edição
                    </button>
                  ) : (
                    !aula.edicao_professor_aberta && (
                      <button
                        type="button"
                        className={styles.acaoSecundaria}
                        disabled={salvando === aula.id}
                        onClick={() => executarAcao(aula.id, "reabrir", { reabrir: true })}
                      >
                        Reabrir para alteração
                      </button>
                    )
                  )}
                </div>

                {aberta === aula.id && (
                  <div className={styles.alunos}>
                    {!alunosPorAula[aula.id] ? (
                      <p className={styles.cardMeta}>Carregando alunos...</p>
                    ) : alunosPorAula[aula.id].length === 0 ? (
                      <p className={styles.cardMeta}>Nenhum aluno nesta turma.</p>
                    ) : (
                      <ul className={styles.alunosLista}>
                        {alunosPorAula[aula.id].map((aluno) => (
                          <li key={aluno.aluno_id} className={styles.alunoLinha}>
                            <span>{aluno.posicao_ordem ?? "—"}. {aluno.nome_completo}</span>
                            <span
                              className={
                                aluno.presente === false
                                  ? styles.falta
                                  : aluno.presente === true
                                    ? styles.presente
                                    : styles.semRegistro
                              }
                            >
                              {aluno.presente === false ? "Falta" : aluno.presente === true ? "Presente" : "Sem registro"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
