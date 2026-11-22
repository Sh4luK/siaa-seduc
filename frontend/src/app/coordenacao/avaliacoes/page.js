"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Image from "next/image";
import logo from "@/assets/logo.png";

const API_BASE = "/backend-api";

export default function AvaliacoesCoordenacaoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [filtroTurma, setFiltroTurma] = useState("");
  const [turmasDisponiveis, setTurmasDisponiveis] = useState([]);
  const [erros, setErros] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`, { credentials: "include" });
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/coordenacao/login");
          return;
        }

        await carregarAvaliacoes();
      } catch (error) {
        setErros([`Erro ao carregar dados: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function carregarAvaliacoes(turma = "") {
    try {
      const params = new URLSearchParams();
      if (turma) params.set("turma", turma);
      const qs = params.toString();
      const res = await fetch(`${API_BASE}/api/coordenacao/avaliacoes${qs ? `?${qs}` : ""}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Falha ao buscar avaliações (status ${res.status})`);

      const data = await res.json();
      const lista = data.avaliacoes || [];
      setAvaliacoes(lista);

      // Sem filtro a lista traz todas as avaliações: as turmas delas viram as
      // opções da caixa de seleção (só turmas que têm alguma avaliação).
      if (!turma) {
        const turmas = [...new Set(lista.map((a) => a.turma).filter(Boolean))];
        turmas.sort((a, b) => a.localeCompare(b, "pt-BR"));
        setTurmasDisponiveis(turmas);
      }
    } catch (error) {
      setErros([`Erro ao carregar avaliações: ${error.message}`]);
    }
  }

  function handleSelecionarTurma(e) {
    const turma = e.target.value;
    setFiltroTurma(turma);
    carregarAvaliacoes(turma);
  }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <div className={styles.headerLoading}>
            <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
            <p className={styles.subtituloLoading}>Carregando...</p>
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
            <h1 className={styles.title}>Avaliações</h1>
            <p className={styles.subtitle}>
              Avaliações cadastradas por todos os professores.
            </p>
          </div>
          <button
            type="button"
            className={styles.voltarBotao}
            onClick={() => router.push("/coordenacao")}
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

        <div className={styles.filtroForm}>
          <select
            className={styles.input}
            aria-label="Filtrar por turma"
            value={filtroTurma}
            onChange={handleSelecionarTurma}
          >
            <option value="">Todas as turmas</option>
            {turmasDisponiveis.map((turma) => (
              <option key={turma} value={turma}>
                {turma}
              </option>
            ))}
          </select>
          {filtroTurma && (
            <button
              type="button"
              className={styles.limparBotao}
              onClick={() => {
                setFiltroTurma("");
                carregarAvaliacoes("");
              }}
            >
              Limpar
            </button>
          )}
        </div>

        {avaliacoes.length === 0 ? (
          <p className={styles.vazio}>Nenhuma avaliação encontrada.</p>
        ) : (
          <div className={styles.grid}>
            {avaliacoes.map((a) => (
              <div key={a.id}
                className={styles.card}
                onClick={() => router.push(`/coordenacao/avaliacoes/${a.id}`)}
                style={{ cursor: "pointer" }}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitulo}>{a.titulo}</h3>
                  <span className={styles.cardData}>
                    {String(a.data).slice(0, 10).split("-").reverse().join("/")}
                  </span>
                </div>
                <p className={styles.cardLinha}>
                  <strong>Professor:</strong> {a.professor}
                </p>
                <p className={styles.cardLinha}>
                  <strong>Disciplina:</strong> {a.disciplina}
                </p>
                <p className={styles.cardLinha}>
                  <strong>Turma:</strong> {a.turma}
                </p>
                <p className={styles.cardMeta}>{a.total_questoes} questões</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}