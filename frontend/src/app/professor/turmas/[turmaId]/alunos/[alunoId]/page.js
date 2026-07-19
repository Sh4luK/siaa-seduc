"use client";

import { useEffect, useState, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import layoutStyles from "../../../../page.module.css";
import styles from "./notas.module.css";

const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

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
  const [nomeDisciplina, setNomeDisciplina] = useState("");
  const [mensagem, setMensagem] = useState(null);
  const [erros, setErros] = useState([]);

  const [notas, setNotas] = useState({
    nm1_t1: "", nm2_t1: "", nm3_t1: "", rpt_t1: "", mt_t1: null, mtf_t1: null,
    nm1_t2: "", nm2_t2: "", nm3_t2: "", rpt_t2: "", mt_t2: null, mtf_t2: null,
    nm1_t3: "", nm2_t3: "", nm3_t3: "", rpt_t3: "", mt_t3: null, mtf_t3: null,
    ma: null, pf: "", maf: null, rcf: "", tgf: "0", rf: "CUR",
  });

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

        // O backend resolve a disciplina automaticamente a partir da turma,
        // então não precisamos mais buscar/mandar disciplina_id aqui.
        const notasUrl = `${API_BASE}/api/teacher/notas/get?aluno=${alunoId}&turma=${turmaId}&professor=${profId}`;
        const notasRes = await fetch(notasUrl);

        if (!notasRes.ok) throw new Error(`Falha ao buscar notas (status ${notasRes.status})`);
        const notasData = await notasRes.json();

        setAluno(notasData.aluno);
        setNomeDisciplina(notasData.disciplina?.nome || "");
        setNotas((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(notasData.notas).map(([k, v]) => [
              k,
              v ?? (typeof prev[k] === "string" ? "" : null),
            ])
          ),
        }));
      } catch (error) {
        setErros([`Erro ao carregar dados do aluno: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [turmaId, alunoId, router]);

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
          professor: professorId,
          notas,
        }),
      });

      if (!res.ok) throw new Error(`Falha ao salvar (status ${res.status})`);

      const data = await res.json();

      if (data.erros?.length) setErros(data.erros);
      else setMensagem("Notas salvas com sucesso.");

      if (data.notas) {
        setNotas((prev) => ({ ...prev, ...data.notas }));
      }
    } catch (error) {
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
              Lançar notas — {aluno?.nome_completo || "Aluno"}
            </h1>
            <p className={styles.subtitle}>Disciplina: {nomeDisciplina || "—"}</p>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            {mensagem && <p className={styles.mensagemSucesso}>{mensagem}</p>}

            {aluno && (
              <>
                <div className={styles.tabelaWrapper}>
                  <table className={styles.tabela}>
                    <thead>
                      <tr>
                        <th colSpan={6}>1º Trimestre</th>
                        <th colSpan={6}>2º Trimestre</th>
                        <th colSpan={6}>3º Trimestre</th>
                        <th rowSpan={2}>MA</th>
                        <th rowSpan={2}>PF</th>
                        <th rowSpan={2}>MAF</th>
                        <th rowSpan={2}>RCF</th>
                        <th rowSpan={2}>TGF</th>
                        <th rowSpan={2}>RF</th>
                      </tr>
                      <tr>
                        <th>NM1</th><th>NM2</th><th>NM3</th><th>MT</th><th>RPT</th><th>MTF</th>
                        <th>NM1</th><th>NM2</th><th>NM3</th><th>MT</th><th>RPT</th><th>MTF</th>
                        <th>NM1</th><th>NM2</th><th>NM3</th><th>MT</th><th>RPT</th><th>MTF</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {[1, 2, 3].map((t) => (
                          <Fragment key={t}>
                            <td key={`nm1_t${t}`}>
                              <input
                                type="text"
                                inputMode="decimal"
                                className={styles.input}
                                value={notas[`nm1_t${t}`]}
                                onChange={(e) => handleChange(`nm1_t${t}`, e.target.value)}
                              />
                            </td>
                            <td key={`nm2_t${t}`}>
                              <input
                                type="text"
                                inputMode="decimal"
                                className={styles.input}
                                value={notas[`nm2_t${t}`]}
                                onChange={(e) => handleChange(`nm2_t${t}`, e.target.value)}
                              />
                            </td>
                            <td key={`nm3_t${t}`}>
                              <input
                                type="text"
                                inputMode="decimal"
                                className={styles.input}
                                value={notas[`nm3_t${t}`]}
                                onChange={(e) => handleChange(`nm3_t${t}`, e.target.value)}
                              />
                            </td>
                            <td key={`mt_t${t}`} className={styles.calculadoCell}>
                              {notas[`mt_t${t}`] ?? "—"}
                            </td>
                            <td key={`rpt_t${t}`}>
                              <input
                                type="text"
                                inputMode="decimal"
                                className={styles.input}
                                value={notas[`rpt_t${t}`]}
                                onChange={(e) => handleChange(`rpt_t${t}`, e.target.value)}
                              />
                            </td>
                            <td key={`mtf_t${t}`} className={styles.calculadoCell}>
                              {notas[`mtf_t${t}`] ?? "—"}
                            </td>
                          </Fragment>
                        ))}
                        <td className={styles.calculadoCell}>{notas.ma ?? "—"}</td>
                        <td>
                          <input
                            type="text"
                            inputMode="decimal"
                            className={styles.input}
                            value={notas.pf}
                            onChange={(e) => handleChange("pf", e.target.value)}
                          />
                        </td>
                        <td className={styles.calculadoCell}>{notas.maf ?? "—"}</td>
                        <td>
                          <input
                            type="text"
                            inputMode="decimal"
                            className={styles.input}
                            value={notas.rcf}
                            onChange={(e) => handleChange("rcf", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            className={styles.input}
                            value={notas.tgf}
                            onChange={(e) => setNotas((prev) => ({ ...prev, tgf: e.target.value }))}
                          />
                        </td>
                        <td>
                          <select
                            className={styles.select}
                            value={notas.rf}
                            onChange={(e) => setNotas((prev) => ({ ...prev, rf: e.target.value }))}
                          >
                            {RF_OPCOES.map(([valor]) => (
                              <option key={valor} value={valor}>{valor}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

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

