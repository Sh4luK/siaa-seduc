"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

const STATUS_LABEL = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
};

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function ResponsavelPainelPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");

  const [vinculos, setVinculos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [alunoNome, setAlunoNome] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [enviando, setEnviando] = useState(false);

  const router = useRouter();

  const carregarVinculos = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch(`${API_BASE}/api/responsavel/vinculos`);
      if (!res.ok) throw new Error(`Falha ao buscar vínculos (status ${res.status})`);
      const data = await res.json();
      setVinculos(data.vinculos || []);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/responsavel/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/responsavel/login");
          return;
        }
        setAuthenticated(true);
        setNomeCompleto(authData.responsavel?.nome_completo || "");
        setLoading(false);
        await carregarVinculos();
      } catch (error) {
        setErro(`Erro ao carregar dados: ${error.message}`);
        setLoading(false);
      }
    }
    init();
  }, [router, carregarVinculos]);

  async function handleSolicitar(e) {
    e.preventDefault();
    setErro(null);

    if (!alunoNome.trim() || !parentesco.trim()) {
      setErro("Preencha o nome do aluno e o parentesco.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/responsavel/vinculos/solicitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aluno_nome_completo: alunoNome.trim(),
          parentesco: parentesco.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Não foi possível enviar a solicitação.");
      }
      setAlunoNome("");
      setParentesco("");
      setMostrarForm(false);
      await carregarVinculos();
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <p className={styles.subtituloLoading}>Verificando credenciais…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  const firstName = nomeCompleto.split(" ")[0];

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        Governo do Estado do Piauí — Secretaria de Estado da Educação
      </div>

      <div className={styles.wrapper}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Olá, {firstName}</h1>
            <p className={styles.subtitle}>Acompanhamento dos seus dependentes.</p>
          </div>
          <button className={styles.novoBotao} onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? "Cancelar" : "+ Vincular aluno"}
          </button>
        </div>

        {erro && <div className={styles.erro}>{erro}</div>}

        {mostrarForm && (
          <form onSubmit={handleSolicitar} className={styles.form}>
            <div className={styles.linhaDupla}>
              <div className={styles.campo}>
                <label className={styles.label}>Nome completo do aluno</label>
                <input
                  className={styles.input}
                  value={alunoNome}
                  onChange={(e) => setAlunoNome(e.target.value)}
                  placeholder="Digite exatamente como está no cadastro escolar"
                />
              </div>
              <div className={styles.campo}>
                <label className={styles.label}>Parentesco</label>
                <input
                  className={styles.input}
                  placeholder="Ex: Mãe, Pai, Avó..."
                  value={parentesco}
                  onChange={(e) => setParentesco(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" disabled={enviando} className={styles.enviarBtn}>
              {enviando ? "Enviando..." : "Enviar solicitação"}
            </button>
          </form>
        )}

        {carregando ? (
          <p className={styles.subtitle}>Carregando...</p>
        ) : vinculos.length === 0 ? (
          <p className={styles.vazio}>
            Você ainda não está vinculado a nenhum aluno. Use o botão acima pra solicitar.
          </p>
        ) : (
          <ul className={styles.lista}>
            {vinculos.map((v) => (
              <li key={v.id} className={styles.card}>
                <div className={styles.cardInfo}>
                  <div className={styles.cardTopo}>
                    <p className={styles.cardNome}>{v.aluno_nome}</p>
                    <span
                      className={
                        v.status === "APROVADO"
                          ? styles.badgeAprovado
                          : v.status === "RECUSADO"
                          ? styles.badgeRecusado
                          : styles.badgePendente
                      }
                    >
                      {STATUS_LABEL[v.status]}
                    </span>
                  </div>
                  <p className={styles.cardMeta}>
                    {v.parentesco} · Turma: {v.aluno_turma || "—"} · solicitado em {formatarData(v.data_solicitacao)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}