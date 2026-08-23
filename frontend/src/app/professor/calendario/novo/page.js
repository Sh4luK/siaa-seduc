"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import layoutStyles from "../../page.module.css";
import styles from "./page.module.css";

const API_BASE = "http://127.0.0.1:8000";

function hojeISO() {
  const hoje = new Date();
  const offset = hoje.getTimezoneOffset();
  const local = new Date(hoje.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

export default function NovoEventoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [professorId, setProfessorId] = useState(null);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [turmasAgrupadas, setTurmasAgrupadas] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [erros, setErros] = useState([]);

  const [form, setForm] = useState({
    titulo: "",
    data: hojeISO(),
    descricao: "",
    turma_id: "",
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
        setProfessorId(authData.teacher.id);
        setNomeCompleto(authData.teacher.nome_completo);

        const turmasRes = await fetch(
          `${API_BASE}/api/teacher/search/turmas?nome_completo=${encodeURIComponent(authData.teacher.nome_completo)}`
        );
        if (turmasRes.ok) {
          const turmasData = await turmasRes.json();
          const turmas = turmasData.turmas || [];

          const grupos = {};
          for (const turma of turmas) {
            const chave = turma.turma;
            if (!grupos[chave]) {
              grupos[chave] = { nomeTurma: chave, opcoes: [] };
            }
            grupos[chave].opcoes.push(turma);
          }
          setTurmasAgrupadas(Object.values(grupos));
        }
      } catch (error) {
        setErros([`Erro ao carregar dados: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  function handleFormChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSaving(true);
    setMensagem(null);
    setErros([]);

    if (!form.titulo.trim()) {
      setErros(["O título do evento é obrigatório."]);
      setSaving(false);
      return;
    }

    if (!form.data) {
      setErros(["A data do evento é obrigatória."]);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/teacher/calendario/eventos/criar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professor: professorId,
          titulo: form.titulo.trim(),
          descricao: form.descricao.trim(),
          data: form.data,
          turma: form.turma_id || null,
        }),
      });

      if (!res.ok) {
        const corpoErro = await res.text();
        throw new Error(`Falha ao criar evento (status ${res.status}) - ${corpoErro}`);
      }

      setMensagem("Evento criado com sucesso.");
      setTimeout(() => {
        router.push("/professor/calendario");
      }, 900);
    } catch (error) {
      setErros([`Erro ao salvar evento: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}>
            <span className={layoutStyles.loadingBarFill} />
          </div>
          <p className={layoutStyles.loadingText}>Verificando credenciais…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${styles.pageCentered}`}>
      <div className={layoutStyles.content}>
        <main className={layoutStyles.main}>
          <div className={styles.wrapper}>
            <div className={styles.headerRow}>
              <div>
                <h1 className={styles.title}>Novo evento</h1>
                <p className={styles.subtitle}>Cadastre um evento no calendário escolar.</p>
              </div>
              <button
                type="button"
                className={styles.voltarBotao}
                onClick={() => router.push("/professor/calendario")}
              >
                Voltar
              </button>
            </div>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            {mensagem && <p className={styles.mensagemSucesso}>{mensagem}</p>}

            <form className={styles.form} onSubmit={handleSalvar}>
              <div className={styles.campo}>
                <label className={styles.label} htmlFor="titulo">
                  Título <span className={styles.obrigatorio}>*</span>
                </label>
                <input
                  id="titulo"
                  type="text"
                  className={styles.input}
                  placeholder="Ex: Prova de Matemática, Reunião de pais..."
                  value={form.titulo}
                  onChange={(e) => handleFormChange("titulo", e.target.value)}
                  required
                />
              </div>

              <div className={styles.linhaDupla}>
                <div className={styles.campo}>
                  <label className={styles.label} htmlFor="data">
                    Data <span className={styles.obrigatorio}>*</span>
                  </label>
                  <input
                    id="data"
                    type="date"
                    className={styles.input}
                    value={form.data}
                    onChange={(e) => handleFormChange("data", e.target.value)}
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label className={styles.label} htmlFor="turma">
                    Turma <span className={styles.opcional}>(opcional)</span>
                  </label>
                  <select
                    id="turma"
                    className={styles.select}
                    value={form.turma_id}
                    onChange={(e) => handleFormChange("turma_id", e.target.value)}
                  >
                    <option value="">Evento geral (sem turma específica)</option>
                    {turmasAgrupadas.map((grupo) => (
                      <option key={grupo.nomeTurma} value={grupo.opcoes[0].id}>
                        {grupo.nomeTurma}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.campo}>
                <label className={styles.label} htmlFor="descricao">
                  Descrição <span className={styles.opcional}>(opcional)</span>
                </label>
                <textarea
                  id="descricao"
                  className={styles.textarea}
                  placeholder="Detalhes adicionais sobre o evento..."
                  value={form.descricao}
                  onChange={(e) => handleFormChange("descricao", e.target.value)}
                  rows={4}
                />
              </div>

              <button type="submit" className={styles.botaoSalvar} disabled={saving}>
                {saving ? "Salvando..." : "Criar evento"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}