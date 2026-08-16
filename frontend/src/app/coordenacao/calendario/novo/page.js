"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Image from "next/image";
import logo from "@/assets/logo.png";

const API_BASE = "https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev";

function hojeISO() {
  const hoje = new Date();
  const offset = hoje.getTimezoneOffset();
  const local = new Date(hoje.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

export default function NovoEventoCoordenacaoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/coordenacao/login");
          return;
        }

        // Reaproveita a listagem de professores para montar a lista de turmas
        const res = await fetch(`${API_BASE}/api/coordenacao/professores`);
        if (res.ok) {
          const data = await res.json();
          const grupos = {};
          for (const professor of data.professores || []) {
            for (const turma of professor.turmas || []) {
              if (!grupos[turma.nome_turma]) {
                grupos[turma.nome_turma] = { nomeTurma: turma.nome_turma, id: turma.registro_ids?.[0] };
              }
            }
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
      const res = await fetch(`${API_BASE}/api/coordenacao/calendario/eventos/criar`, {
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
        throw new Error(`Falha ao criar evento (status ${res.status}) - ${corpoErro}`);
      }

      setMensagem("Evento criado com sucesso.");
      setTimeout(() => {
        router.push("/coordenacao/calendario");
      }, 900);
    } catch (error) {
      setErros([`Erro ao salvar evento: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <div className={styles.headerLoading}>
            <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
            <p className={styles.subtituloLoading}>Carregando…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Novo evento</h1>
            <p className={styles.subtitle}>Cadastre um evento no calendário escolar.</p>
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
              placeholder="Ex: Conselho de classe, Feriado, Reunião de pais..."
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
    </div>
  );
}