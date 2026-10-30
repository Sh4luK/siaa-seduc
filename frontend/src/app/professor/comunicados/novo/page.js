"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import layoutStyles from "../../page.module.css";
import styles from "./page.module.css";

const API_BASE = "/backend-api";

function hojeISO() {
  const hoje = new Date();
  const local = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().split("T")[0];
}

export default function NovoComunicadoPage() {
  const router = useRouter();
  const [professor, setProfessor] = useState(null);
  const [turmas, setTurmas] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [data, setData] = useState(hojeISO);
  const [turmaId, setTurmaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erros, setErros] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`, { credentials: "include" });
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/professor/login");
          return;
        }

        setProfessor(authData.teacher);
        const turmasRes = await fetch(
          `${API_BASE}/api/teacher/search/turmas?nome_completo=${encodeURIComponent(authData.teacher.nome_completo)}`,
          { credentials: "include" }
        );
        if (!turmasRes.ok) {
          throw new Error(`Falha ao buscar turmas (status ${turmasRes.status})`);
        }
        const turmasData = await turmasRes.json();
        setTurmas(turmasData.turmas || []);
      } catch (error) {
        setErros([`Erro ao carregar dados: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErros([]);

    try {
      const res = await fetch(`${API_BASE}/api/teacher/comunicados/criar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professor: professor.id,
          titulo: titulo.trim(),
          mensagem: mensagem.trim(),
          data,
          turma: turmaId || null,
        }),
      });

      if (!res.ok) {
        const corpoErro = await res.text();
        throw new Error(`Falha ao criar comunicado (status ${res.status}) - ${corpoErro}`);
      }

      router.push("/professor/comunicados");
    } catch (error) {
      setErros([`Erro ao criar comunicado: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.content}>
          <main className={layoutStyles.main}>Carregando...</main>
        </div>
      </div>
    );
  }

  if (!professor) return null;

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.content}>
        <main className={layoutStyles.main}>
          <div className={styles.wrapper}>
            <Link href="/professor/comunicados" className={styles.voltarLink}>
              Voltar para comunicados
            </Link>
            <h1 className={styles.title}>Novo comunicado</h1>
            <p className={styles.subtitle}>Envie um aviso geral ou para uma turma específica.</p>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((erro, index) => <li key={index}>{erro}</li>)}
              </ul>
            )}

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.campo}>
                <span className={styles.label}>Título</span>
                <input
                  className={styles.input}
                  type="text"
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  required
                  maxLength={255}
                />
              </label>

              <label className={styles.campo}>
                <span className={styles.label}>Destinatário</span>
                <select
                  className={styles.input}
                  value={turmaId}
                  onChange={(event) => setTurmaId(event.target.value)}
                >
                  <option value="">Geral — todas as turmas</option>
                  {turmas.map((turma) => (
                    <option key={turma.id} value={turma.id}>
                      {turma.turma} — {turma.disciplina_lecionada}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.campo}>
                <span className={styles.label}>Data</span>
                <input
                  className={styles.input}
                  type="date"
                  value={data}
                  onChange={(event) => setData(event.target.value)}
                  required
                />
              </label>

              <label className={styles.campo}>
                <span className={styles.label}>Mensagem</span>
                <textarea
                  className={styles.textarea}
                  value={mensagem}
                  onChange={(event) => setMensagem(event.target.value)}
                  rows={6}
                  required
                />
              </label>

              <button className={styles.botaoSalvar} type="submit" disabled={saving}>
                {saving ? "Enviando..." : "Enviar comunicado"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
