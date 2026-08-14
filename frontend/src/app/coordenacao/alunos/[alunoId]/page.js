"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function VisaoGeralAlunoPage() {
  const { alunoId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [aluno, setAluno] = useState(null);
  const [comunicados, setComunicados] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [advertencias, setAdvertencias] = useState([]);
  const [erros, setErros] = useState([]);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "" });
  const [deletandoId, setDeletandoId] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/coordenacao/login");
          return;
        }

        const res = await fetch(`${API_BASE}/api/coordenacao/alunos/${alunoId}/visao-geral`);
        if (!res.ok) throw new Error(`Falha ao buscar dados (status ${res.status})`);
        const data = await res.json();

        setAluno(data.aluno);
        setComunicados(data.comunicados || []);
        setEventos(data.eventos || []);
        setAdvertencias(data.advertencias || []);
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

  async function handleRegistrarAdvertencia(e) {
    e.preventDefault();
    setSaving(true);
    setErros([]);
    setMensagemSucesso(null);

    if (!form.titulo.trim()) {
      setErros(["O título da advertência é obrigatório."]);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/alunos/${alunoId}/advertencias/criar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo.trim(),
          descricao: form.descricao.trim(),
        }),
      });

      if (!res.ok) throw new Error(`Falha ao registrar (status ${res.status})`);

      const data = await res.json();
      setAdvertencias((prev) => [data.advertencia, ...prev]);
      setForm({ titulo: "", descricao: "" });
      setMostrarForm(false);
      setMensagemSucesso("Advertência registrada com sucesso.");
    } catch (error) {
      setErros([`Erro ao registrar advertência: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletarAdvertencia(advertenciaId) {
    setDeletandoId(advertenciaId);
    try {
      const res = await fetch(
        `${API_BASE}/api/coordenacao/advertencias/${advertenciaId}/deletar`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`Falha ao remover (status ${res.status})`);

      setAdvertencias((prev) => prev.filter((a) => a.id !== advertenciaId));
    } catch (error) {
      setErros([`Erro ao remover advertência: ${error.message}`]);
    } finally {
      setDeletandoId(null);
    }
  }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <p className={styles.subtituloLoading}>Carregando...</p>
      </div>
    );
  }

  const iniciais = aluno?.nome_completo
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <Link href="/coordenacao/alunos" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Alunos
        </Link>

        <div className={styles.perfilCard}>
          <span className={styles.perfilAvatar}>{iniciais}</span>
          <div className={styles.perfilInfo}>
            <p className={styles.perfilNome}>{aluno?.nome_completo}</p>
            <p className={styles.perfilMeta}>
              {aluno?.turma || "—"} · {aluno?.serie || "—"} · {aluno?.curso || "—"}
            </p>
          </div>
          <Link href={`/coordenacao/alunos/${alunoId}/editar`} className={styles.editarBotao}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
              <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
            </svg>
            Editar dados
          </Link>
        </div>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        {mensagemSucesso && <p className={styles.mensagemSucesso}>{mensagemSucesso}</p>}

        <div className={styles.colunas}>
          {/* Comunicados */}
          <section className={styles.secao}>
            <h2 className={styles.secaoTitulo}>
              Comunicados
              <span className={styles.contador}>{comunicados.length}</span>
            </h2>

            {comunicados.length === 0 ? (
              <p className={styles.vazio}>Nenhum comunicado relevante.</p>
            ) : (
              <ul className={styles.itemLista}>
                {comunicados.map((c) => (
                  <li key={c.id} className={styles.itemCard}>
                    <div className={styles.itemTopo}>
                      <p className={styles.itemTitulo}>{c.titulo}</p>
                      <span className={styles.itemData}>{formatarData(c.data)}</span>
                    </div>
                    <span className={c.nome_turma ? styles.badgeTurma : styles.badgeGeral}>
                      {c.nome_turma || "Geral"}
                    </span>
                    <p className={styles.itemTexto}>{c.mensagem}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Eventos / avisos do calendário */}
          <section className={styles.secao}>
            <h2 className={styles.secaoTitulo}>
              Avisos do calendário
              <span className={styles.contador}>{eventos.length}</span>
            </h2>

            {eventos.length === 0 ? (
              <p className={styles.vazio}>Nenhum evento relevante.</p>
            ) : (
              <ul className={styles.itemLista}>
                {eventos.map((e) => (
                  <li key={e.id} className={styles.itemCard}>
                    <div className={styles.itemTopo}>
                      <p className={styles.itemTitulo}>{e.titulo}</p>
                      <span className={styles.itemData}>{formatarData(e.data)}</span>
                    </div>
                    <span className={e.nome_turma ? styles.badgeTurma : styles.badgeGeral}>
                      {e.nome_turma || "Geral"}
                    </span>
                    {e.descricao && <p className={styles.itemTexto}>{e.descricao}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Advertências */}
          <section className={styles.secao}>
            <div className={styles.secaoHeaderComBotao}>
              <h2 className={styles.secaoTitulo}>
                Advertências
                <span className={styles.contadorAlerta}>{advertencias.length}</span>
              </h2>
              <button
                type="button"
                className={styles.novaAdvertenciaBotao}
                onClick={() => setMostrarForm((v) => !v)}
              >
                {mostrarForm ? "Cancelar" : "+ Nova"}
              </button>
            </div>

            {mostrarForm && (
              <form className={styles.formAdvertencia} onSubmit={handleRegistrarAdvertencia}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Título da advertência"
                  value={form.titulo}
                  onChange={(e) => handleFormChange("titulo", e.target.value)}
                  required
                />
                <textarea
                  className={styles.textarea}
                  placeholder="Descrição da ocorrência..."
                  rows={3}
                  value={form.descricao}
                  onChange={(e) => handleFormChange("descricao", e.target.value)}
                />
                <button type="submit" className={styles.botaoRegistrar} disabled={saving}>
                  {saving ? "Registrando..." : "Registrar advertência"}
                </button>
              </form>
            )}

            {advertencias.length === 0 ? (
              <p className={styles.vazio}>Nenhuma advertência registrada.</p>
            ) : (
              <ul className={styles.itemLista}>
                {advertencias.map((a) => (
                  <li key={a.id} className={`${styles.itemCard} ${styles.itemCardAlerta}`}>
                    <div className={styles.itemTopo}>
                      <p className={styles.itemTitulo}>{a.titulo}</p>
                      <span className={styles.itemData}>{formatarData(a.data)}</span>
                    </div>
                    {a.professor && <p className={styles.itemProfessor}>Por: {a.professor}</p>}
                    {a.descricao && <p className={styles.itemTexto}>{a.descricao}</p>}
                    <button
                      type="button"
                      className={styles.removerAdvertenciaBotao}
                      onClick={() => handleDeletarAdvertencia(a.id)}
                      disabled={deletandoId === a.id}
                    >
                      {deletandoId === a.id ? "Removendo..." : "Remover"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}