"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

export default function EditarEventoPage() {
  const { eventoId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [turmasAgrupadas, setTurmasAgrupadas] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [erros, setErros] = useState([]);

  const [form, setForm] = useState({
    titulo: "",
    data: "",
    descricao: "",
    turma_id: "",
  });

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/coordenacao/login");
          return;
        }

        const [turmasRes, eventoRes] = await Promise.all([
          fetch(`${API_BASE}/api/coordenacao/professores`),
          fetch(`${API_BASE}/api/coordenacao/calendario/eventos/${eventoId}`),
        ]);

        if (turmasRes.ok) {
          const turmasData = await turmasRes.json();
          const grupos = {};
          for (const professor of turmasData.professores || []) {
            for (const turma of professor.turmas || []) {
              if (!grupos[turma.nome_turma]) {
                grupos[turma.nome_turma] = { nomeTurma: turma.nome_turma, id: turma.registro_ids?.[0] };
              }
            }
          }
          setTurmasAgrupadas(Object.values(grupos));
        }

        if (!eventoRes.ok) throw new Error(`Falha ao buscar evento (status ${eventoRes.status})`);
        const eventoData = await eventoRes.json();

        setForm({
          titulo: eventoData.evento.titulo || "",
          data: eventoData.evento.data || "",
          descricao: eventoData.evento.descricao || "",
          turma_id: eventoData.evento.turma_id || "",
        });
      } catch (error) {
        setErros([`Erro ao carregar dados: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [eventoId, router]);

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
      const res = await fetch(`${API_BASE}/api/coordenacao/calendario/eventos/${eventoId}/editar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo.trim(),
          descricao: form.descricao.trim(),
          data: form.data,
          turma: form.turma_id || null,
        }),
      });

      if (!res.ok) {
        const corpoErro = await res.text();
        throw new Error(`Falha ao salvar (status ${res.status}) - ${corpoErro}`);
      }

      setMensagem("Evento atualizado com sucesso.");
      setTimeout(() => {
        router.push("/coordenacao/calendario");
      }, 900);
    } catch (error) {
      setErros([`Erro ao salvar alterações: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <p className={styles.subtituloLoading}>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Editar evento</h1>
            <p className={styles.subtitle}>Atualize os dados do evento.</p>
          </div>
          <button
            type="button"
            className={styles.voltarBotao}
            onClick={() => router.push("/coordenacao/calendario")}
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
                <option value="">Evento geral (toda a escola)</option>
                {turmasAgrupadas.map((t) => (
                  <option key={t.nomeTurma} value={t.id}>
                    {t.nomeTurma}
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
              value={form.descricao}
              onChange={(e) => handleFormChange("descricao", e.target.value)}
              rows={4}
            />
          </div>

          <button type="submit" className={styles.botaoSalvar} disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </div>
    </div>
  );
}