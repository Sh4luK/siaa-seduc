"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function EditarAlunoPage() {
  const { alunoId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [erros, setErros] = useState([]);

  const [opcoesTurmas, setOpcoesTurmas] = useState([]);
  const [opcoesSeries, setOpcoesSeries] = useState([]);
  const [opcoesCursos, setOpcoesCursos] = useState([]);

  const [form, setForm] = useState({
    nome_completo: "",
    turma: "",
    serie: "",
    escola: "",
    periodo: "",
    curso: "",
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

        const [escolaRes, opcoesRes, alunoRes] = await Promise.all([
          fetch(`${API_BASE}/api/coordenacao/escola`),
          fetch(`${API_BASE}/api/coordenacao/opcoes-cadastro-aluno`),
          fetch(`${API_BASE}/api/coordenacao/alunos/${alunoId}`),
        ]);

        if (!opcoesRes.ok) throw new Error(`Falha ao buscar opções (status ${opcoesRes.status})`);
        const opcoesData = await opcoesRes.json();
        setOpcoesTurmas(opcoesData.turmas || []);
        setOpcoesSeries(opcoesData.series || []);
        setOpcoesCursos(opcoesData.cursos || []);

        if (!alunoRes.ok) throw new Error(`Falha ao buscar aluno (status ${alunoRes.status})`);
        const alunoData = await alunoRes.json();

        let escolaCoordenacao = "";
        if (escolaRes.ok) {
          const escolaData = await escolaRes.json();
          escolaCoordenacao = escolaData.escola || "";
        }

        setForm({
          nome_completo: alunoData.aluno.nome_completo || "",
          turma: alunoData.aluno.turma || "",
          serie: alunoData.aluno.serie || "",
          // Trava na escola do coordenador logado, independente do valor
          // que estava salvo antes — mantém consistência de gestão por escola.
          escola: escolaCoordenacao || alunoData.aluno.escola || "",
          periodo: alunoData.aluno.periodo || "",
          curso: alunoData.aluno.curso || "",
        });
      } catch (error) {
        setErros([`Erro ao carregar dados: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [alunoId, router]);

  function handleFormChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSaving(true);
    setErros([]);
    setMensagem(null);

    if (!form.nome_completo.trim()) {
      setErros(["O nome completo é obrigatório."]);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/alunos/${alunoId}/editar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const corpoErro = await res.text();
        let msg = `Falha ao salvar (status ${res.status})`;
        try {
          const json = JSON.parse(corpoErro);
          if (json.message) msg = json.message;
        } catch {}
        throw new Error(msg);
      }

      setMensagem("Aluno atualizado com sucesso.");
      setTimeout(() => {
        router.push("/coordenacao/alunos");
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
            <h1 className={styles.title}>Editar aluno</h1>
            <p className={styles.subtitle}>Atualize os dados de matrícula do aluno.</p>
          </div>
          <button
            type="button"
            className={styles.voltarBotao}
            onClick={() => router.push("/coordenacao/alunos")}
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
            <label className={styles.label} htmlFor="nome_completo">
              Nome completo <span className={styles.obrigatorio}>*</span>
            </label>
            <input
              id="nome_completo"
              type="text"
              className={styles.input}
              value={form.nome_completo}
              onChange={(e) => handleFormChange("nome_completo", e.target.value)}
              required
            />
          </div>

          <div className={styles.secaoDivisor}>
            <h2 className={styles.secaoTitulo}>Matrícula</h2>
            <p className={styles.secaoSubtitulo}>
              Selecione a turma, série, escola e curso do aluno.
            </p>
          </div>

          <div className={styles.linhaDupla}>
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="turma">
                Turma
              </label>
              <select
                id="turma"
                className={styles.select}
                value={form.turma}
                onChange={(e) => handleFormChange("turma", e.target.value)}
              >
                <option value="">Selecione a turma</option>
                {opcoesTurmas.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className={styles.campo}>
              <label className={styles.label} htmlFor="serie">
                Série
              </label>
              <select
                id="serie"
                className={styles.select}
                value={form.serie}
                onChange={(e) => handleFormChange("serie", e.target.value)}
              >
                <option value="">Selecione a série</option>
                {opcoesSeries.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.linhaDupla}>
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="escola">
                Escola
              </label>
              <input
                id="escola"
                type="text"
                className={styles.inputDesabilitado}
                value={form.escola || "—"}
                disabled
              />
            </div>

            <div className={styles.campo}>
              <label className={styles.label} htmlFor="periodo">
                Período
              </label>
              <input
                id="periodo"
                type="text"
                className={styles.input}
                value={form.periodo}
                onChange={(e) => handleFormChange("periodo", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="curso">
              Curso
            </label>
            <select
              id="curso"
              className={styles.select}
              value={form.curso}
              onChange={(e) => handleFormChange("curso", e.target.value)}
            >
              <option value="">Selecione o curso</option>
              {opcoesCursos.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button type="submit" className={styles.botaoSalvar} disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </div>
    </div>
  );
}