"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import layoutStyles from "../../../page.module.css";
import styles from "./frequenciaTurma.module.css";

const API_BASE = "http://127.0.0.1:8000";

function hojeISO() {
  const hoje = new Date();
  const offset = hoje.getTimezoneOffset();
  const local = new Date(hoje.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

function formatarDataExtenso(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function FrequenciaTurmaPage() {
  const { turmaId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Se a URL vier com ?data=AAAA-MM-DD (ex: vindo do histórico de registros),
  // usa essa data como valor inicial em vez da data de hoje.
  const dataDaUrl = searchParams.get("data");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [professorId, setProfessorId] = useState(null);
  const [nomeTurma, setNomeTurma] = useState("");
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState([]);
  const [disciplinaEscolhida, setDisciplinaEscolhida] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(dataDaUrl || hojeISO());
  const [assunto, setAssunto] = useState("");
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [alunos, setAlunos] = useState([]);
  const [mensagem, setMensagem] = useState(null);
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
        const profId = authData.teacher.id;
        setProfessorId(profId);

        const discRes = await fetch(
          `${API_BASE}/api/teacher/turma/disciplinas?turma=${turmaId}&professor=${profId}`
        );
        if (!discRes.ok) throw new Error(`Falha ao buscar disciplinas (status ${discRes.status})`);
        const discData = await discRes.json();

        setNomeTurma(discData.nome_turma || "");
        setDisciplinasDisponiveis(discData.disciplinas || []);

        // Ao vir de um registro específico (turmaId já é o AtravessaPor.id
        // exato daquela disciplina), ou quando só há uma opção disponível,
        // seleciona automaticamente a disciplina correspondente a esse turmaId.
        const disciplinas = discData.disciplinas || [];
        const correspondente = disciplinas.find(
          (d) => String(d.turma_id) === String(turmaId)
        );

        if (correspondente) {
          setDisciplinaEscolhida(correspondente);
        } else if (disciplinas.length === 1) {
          setDisciplinaEscolhida(disciplinas[0]);
        }
      } catch (error) {
        setErros([`Erro ao carregar disciplinas da turma: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [turmaId, router]);

  useEffect(() => {
    if (!disciplinaEscolhida || !professorId || !dataSelecionada) return;

    async function carregarAlunos() {
      setCarregandoAlunos(true);
      setErros([]);
      setMensagem(null);

      try {
        const url = `${API_BASE}/api/teacher/frequencia/turma/get?turma=${disciplinaEscolhida.turma_id}&professor=${professorId}&data=${dataSelecionada}`;
        const res = await fetch(url);
        if (!res.ok) {
          const corpoErro = await res.text();
          throw new Error(`Falha ao buscar frequência (status ${res.status}) - ${corpoErro}`);
        }
        const data = await res.json();

        setAlunos(data.alunos || []);
        setAssunto(data.assunto || "");
      } catch (error) {
        setErros([`Erro ao carregar frequência: ${error.message}`]);
      } finally {
        setCarregandoAlunos(false);
      }
    }

    carregarAlunos();
  }, [disciplinaEscolhida, professorId, dataSelecionada]);

  function togglePresenca(alunoId) {
    setAlunos((prev) =>
      prev.map((a) =>
        a.aluno_id === alunoId ? { ...a, presente: !a.presente } : a
      )
    );
  }

  function marcarTodos(presente) {
    setAlunos((prev) => prev.map((a) => ({ ...a, presente })));
  }

  async function handleSalvar() {
    setSaving(true);
    setMensagem(null);
    setErros([]);

    const lancamentos = alunos.map((a) => ({
      aluno_id: a.aluno_id,
      presente: a.presente,
    }));

    try {
      const res = await fetch(`${API_BASE}/api/teacher/frequencia/turma/salvar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turma: disciplinaEscolhida.turma_id,
          professor: professorId,
          data: dataSelecionada,
          assunto,
          lancamentos,
        }),
      });

      if (!res.ok) {
        const corpoErro = await res.text();
        throw new Error(`Falha ao salvar (status ${res.status}) - ${corpoErro}`);
      }

      const data = await res.json();

      if (data.erros_gerais?.length) {
        setErros(data.erros_gerais);
      } else {
        setMensagem(`Frequência salva com sucesso (${data.total_salvos} aluno(s)).`);
      }
    } catch (error) {
      setErros([`Erro ao salvar frequência: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <p>Carregando...</p>
      </div>
    );
  }

  const totalPresentes = alunos.filter((a) => a.presente).length;
  const totalFaltas = alunos.length - totalPresentes;

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.content}>
        <main className={layoutStyles.main}>
          <div className={styles.wrapper}>
            <h1 className={styles.title}>Frequência — {nomeTurma}</h1>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}

            {!disciplinaEscolhida ? (
              <>
                <p className={styles.subtitle}>Escolha a disciplina para registrar a frequência.</p>

                {disciplinasDisponiveis.length === 0 ? (
                  <p className={styles.subtitle}>Nenhuma disciplina encontrada para esta turma.</p>
                ) : (
                  <div className={styles.disciplinasEscolha}>
                    {disciplinasDisponiveis.map((d) => (
                      <button
                        key={d.turma_id}
                        className={styles.disciplinaBotao}
                        onClick={() => setDisciplinaEscolhida(d)}
                      >
                        {d.disciplina}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.topoControles}>
                  <div className={styles.disciplinaAtual}>
                    <span className={styles.disciplinaAtualLabel}>
                      Disciplina: <strong>{disciplinaEscolhida.disciplina}</strong>
                    </span>

                    {disciplinasDisponiveis.length > 1 && (
                      <button
                        className={styles.trocarBotao}
                        onClick={() => {
                          setDisciplinaEscolhida(null);
                          setAlunos([]);
                          setAssunto("");
                          setMensagem(null);
                          setErros([]);
                        }}
                      >
                        Trocar disciplina
                      </button>
                    )}
                  </div>

                  <label className={styles.dataField}>
                    Data
                    <input
                      type="date"
                      className={styles.dataInput}
                      value={dataSelecionada}
                      onChange={(e) => setDataSelecionada(e.target.value)}
                    />
                  </label>
                </div>

                <p className={styles.dataExtenso}>
                  Registro referente a <strong>{formatarDataExtenso(dataSelecionada)}</strong>
                </p>

                {carregandoAlunos ? (
                  <p className={styles.subtitle}>Carregando alunos...</p>
                ) : (
                  <>
                    <div className={styles.assuntoBloco}>
                      <label className={styles.assuntoLabel} htmlFor="assunto-aula">
                        Assunto do dia
                      </label>
                      <textarea
                        id="assunto-aula"
                        className={styles.assuntoTextarea}
                        placeholder="Descreva o conteúdo trabalhado nesta aula..."
                        value={assunto}
                        onChange={(e) => setAssunto(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className={styles.resumoBarra}>
                      <span className={styles.resumoItem}>
                        {alunos.length} aluno(s)
                      </span>
                      <span className={`${styles.resumoItem} ${styles.resumoPresente}`}>
                        {totalPresentes} presente(s)
                      </span>
                      <span className={`${styles.resumoItem} ${styles.resumoFalta}`}>
                        {totalFaltas} falta(s)
                      </span>

                      <div className={styles.acoesRapidas}>
                        <button className={styles.acaoBotao} onClick={() => marcarTodos(true)}>
                          Marcar todos presentes
                        </button>
                        <button className={styles.acaoBotao} onClick={() => marcarTodos(false)}>
                          Marcar todos faltosos
                        </button>
                      </div>
                    </div>

                    {mensagem && <p className={styles.mensagemSucesso}>{mensagem}</p>}

                    {alunos.length === 0 ? (
                      <p className={styles.subtitle}>Nenhum aluno encontrado para esta turma.</p>
                    ) : (
                      <ul className={styles.alunosLista}>
                        {alunos.map((aluno) => (
                          <li key={aluno.aluno_id} className={styles.alunoLinha}>
                            <span className={styles.alunoPosicao}>{aluno.posicao_ordem ?? "—"}</span>
                            <span className={styles.alunoNome}>{aluno.nome_completo}</span>
                            <button
                              className={`${styles.statusBotao} ${
                                aluno.presente ? styles.statusPresente : styles.statusFalta
                              }`}
                              onClick={() => togglePresenca(aluno.aluno_id)}
                            >
                              {aluno.presente ? "Presente" : "Falta"}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <button
                      onClick={handleSalvar}
                      disabled={saving || alunos.length === 0}
                      className={styles.botaoSalvar}
                    >
                      {saving ? "Salvando..." : "Salvar frequência"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}