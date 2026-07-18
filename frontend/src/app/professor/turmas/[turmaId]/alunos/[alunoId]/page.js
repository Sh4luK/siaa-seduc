"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import layoutStyles from "../../../../page.module.css";
import styles from "./notas.module.css";

const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

const CAMPOS_TRIMESTRE = [
  { key: "nm1", label: "NM1" },
  { key: "nm2", label: "NM2" },
  { key: "nm3", label: "NM3" },
  { key: "rpt", label: "RPT" },
];

const RF_OPCOES = [
  ["CUR", "Cursando"], ["AP", "Aprovado"], ["RE", "Reprovado"],
  ["DE", "Desistente"], ["FA", "Falecido"], ["AB", "Abandono"],
  ["TR", "Transferido"], ["CA", "Cancelado"], ["TT", "Troca de Turma"],
  ["TO", "Transferido Outros"], ["PP", "Para Progressão"], ["ND", "Não Definido"],
];

export default function LancarNotasPage() {
  const { turmaId, alunoId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aluno, setAluno] = useState(null);
  const [professorId, setProfessorId] = useState(null);
  const [disciplinaId, setDisciplinaId] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [erros, setErros] = useState([]);

  const [notas, setNotas] = useState({
    nm1_t1: "", nm2_t1: "", nm3_t1: "", rpt_t1: "", mt_t1: null, mtf_t1: null,
    nm1_t2: "", nm2_t2: "", nm3_t2: "", rpt_t2: "", mt_t2: null, mtf_t2: null,
    nm1_t3: "", nm2_t3: "", nm3_t3: "", rpt_t3: "", mt_t3: null, mtf_t3: null,
    ma: null, pf: "", maf: null, rcf: "", tgf: "0", rf: "CUR",
  });

  useEffect(() => {
    let ativo = true; // flag pra evitar setState após desmontagem/re-execução

    async function init() {
      try {
        console.log("=== INÍCIO DEBUG (effect executado) ===");
        console.log("params -> turmaId:", turmaId, "| alunoId:", alunoId);

        const authRes = await fetch(`${API_BASE}/api/teacher/auth`);
        console.log("1) status authRes:", authRes.status);
        const authData = await authRes.json();
        console.log("1) authData:", authData);

        if (!authData.return) {
          router.push("/professor/login");
          return;
        }
        if (ativo) setProfessorId(authData.teacher.id);

        const turmaRes = await fetch(`${API_BASE}/api/teacher/search/turma?turma=${turmaId}`);
        console.log("2) status turmaRes:", turmaRes.status);

        if (!turmaRes.ok) {
          const textoErro = await turmaRes.text();
          console.log("2) corpo do erro turma:", textoErro);
          throw new Error(`Falha ao buscar turma (status ${turmaRes.status})`);
        }

        const turmaData = await turmaRes.json();
        console.log("2) turmaData:", turmaData);

        const discId = turmaData.turma?.disciplina_id;
        console.log("3) discId resolvido:", discId);

        if (!discId) {
          throw new Error(
            "Não foi possível resolver o ID da disciplina a partir da turma."
          );
        }
        if (ativo) setDisciplinaId(discId);

        const notasUrl = `${API_BASE}/api/teacher/notas/get?aluno=${alunoId}&turma=${turmaId}&disciplina=${discId}`;
        console.log("4) URL notas:", notasUrl);

        const notasRes = await fetch(notasUrl);
        console.log("4) status notasRes:", notasRes.status);

        if (!notasRes.ok) {
          const textoErro = await notasRes.text();
          console.log("4) corpo do erro notas:", textoErro);
          throw new Error(`Falha ao buscar notas (status ${notasRes.status})`);
        }

        const notasData = await notasRes.json();
        console.log("5) notasData completo:", JSON.stringify(notasData, null, 2));
        console.log("5b) notasData.aluno:", notasData.aluno);

        if (!ativo) {
          console.log("!! Effect desativado antes do setAluno — ignorando resultado.");
          return;
        }

        setAluno(notasData.aluno);
        console.log("6) chamando setAluno com:", notasData.aluno);

        setNotas((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(notasData.notas).map(([k, v]) => [
              k,
              v ?? (typeof prev[k] === "string" ? "" : null),
            ])
          ),
        }));

        console.log("=== FIM DEBUG (effect concluído com sucesso) ===");
      } catch (error) {
        console.error("Erro detalhado ao carregar dados do aluno:", error);
        if (ativo) setErros([`Erro ao carregar dados do aluno: ${error.message}`]);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    init();

    return () => {
      console.log("!! Cleanup do useEffect executado (StrictMode ou desmontagem).");
      ativo = false;
    };
  }, [turmaId, alunoId, router]);

  console.log("7) estado 'aluno' no render atual:", aluno);

  function handleChange(campo, valor) {
    if (valor === "" || (/^\d{0,2}(\.\d{0,2})?$/.test(valor) && Number(valor) <= 10)) {
      setNotas((prev) => ({ ...prev, [campo]: valor }));
    }
  }

  async function handleSalvar() {
    setSaving(true);
    setMensagem(null);
    setErros([]);

    try {
      const res = await fetch(`${API_BASE}/api/teacher/notas/salvar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aluno: alunoId,
          turma: turmaId,
          disciplina: disciplinaId,
          professor: professorId,
          notas,
        }),
      });

      console.log("salvar) status:", res.status);

      if (!res.ok) {
        const textoErro = await res.text();
        console.log("salvar) corpo do erro:", textoErro);
        throw new Error(`Falha ao salvar (status ${res.status})`);
      }

      const data = await res.json();
      console.log("salvar) resposta:", data);

      if (data.erros?.length) {
        setErros(data.erros);
      } else {
        setMensagem("Notas salvas com sucesso.");
      }

      if (data.notas) {
        setNotas((prev) => ({ ...prev, ...data.notas }));
      }
    } catch (error) {
      console.error("Erro detalhado ao salvar notas:", error);
      setErros([`Erro ao salvar as notas: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <p className={styles.loadingText}>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.content}>
        <main className={layoutStyles.main}>
          <div className={styles.wrapper}>
            <h1 className={styles.title}>
              Lançar notas — {aluno["nome_completo"] || "Aluno"}
            </h1>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}

            {aluno && (
              <>
                {[1, 2, 3].map((t) => (
                  <section key={t} className={styles.trimestre}>
                    <h3 className={styles.trimestreTitle}>{t}º Trimestre</h3>
                    <div className={styles.trimestreRow}>
                      {CAMPOS_TRIMESTRE.map(({ key, label }) => (
                        <label key={key} className={styles.field}>
                          {label}
                          <input
                            type="text"
                            inputMode="decimal"
                            value={notas[`${key}_t${t}`]}
                            onChange={(e) => handleChange(`${key}_t${t}`, e.target.value)}
                            className={styles.input}
                          />
                        </label>
                      ))}
                      <div className={styles.calculado}>
                        <div>MT: {notas[`mt_t${t}`] ?? "—"}</div>
                        <div>MTF: {notas[`mtf_t${t}`] ?? "—"}</div>
                      </div>
                    </div>
                  </section>
                ))}

                <section className={styles.resultadoSection}>
                  <h3 className={styles.trimestreTitle}>Resultado Anual / Final</h3>
                  <div className={styles.resultadoRow}>
                    <div className={styles.resultadoValor}>MA: {notas.ma ?? "—"}</div>

                    <label className={styles.field}>
                      PF
                      <input
                        type="text"
                        inputMode="decimal"
                        value={notas.pf}
                        onChange={(e) => handleChange("pf", e.target.value)}
                        className={styles.input}
                      />
                    </label>

                    <div className={styles.resultadoValor}>MAF: {notas.maf ?? "—"}</div>

                    <label className={styles.field}>
                      RCF
                      <input
                        type="text"
                        inputMode="decimal"
                        value={notas.rcf}
                        onChange={(e) => handleChange("rcf", e.target.value)}
                        className={styles.input}
                      />
                    </label>

                    <label className={styles.field}>
                      TGF (faltas)
                      <input
                        type="number"
                        min="0"
                        value={notas.tgf}
                        onChange={(e) => setNotas((prev) => ({ ...prev, tgf: e.target.value }))}
                        className={styles.input}
                      />
                    </label>

                    <label className={styles.field}>
                      RF
                      <select
                        value={notas.rf}
                        onChange={(e) => setNotas((prev) => ({ ...prev, rf: e.target.value }))}
                        className={styles.select}
                      >
                        {RF_OPCOES.map(([valor, label]) => (
                          <option key={valor} value={valor}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>

                {mensagem && <p className={styles.mensagemSucesso}>{mensagem}</p>}

                <button onClick={handleSalvar} disabled={saving} className={styles.botaoSalvar}>
                  {saving ? "Salvando..." : "Salvar notas"}
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}