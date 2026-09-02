"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Image from "next/image";
import logo from "@/assets/logo.png";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function AvaliacoesCoordenacaoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [filtroTurma, setFiltroTurma] = useState("");
  const [erros, setErros] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
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
      const url = new URL(`${API_BASE}/api/coordenacao/avaliacoes`);
      if (turma) url.searchParams.set("turma", turma);

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Falha ao buscar avaliações (status ${res.status})`);

      const data = await res.json();
      setAvaliacoes(data.avaliacoes || []);
    } catch (error) {
      setErros([`Erro ao carregar avaliações: ${error.message}`]);
    }
  }

  function handleFiltrar(e) {
    e.preventDefault();
    carregarAvaliacoes(filtroTurma.trim());
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

        <form className={styles.filtroForm} onSubmit={handleFiltrar}>
          <input
            type="text"
            className={styles.input}
            placeholder="Filtrar por turma"
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
          />
          <button type="submit" className={styles.filtrarBotao}>
            Filtrar
          </button>
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
        </form>

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
                    {new Date(a.data).toLocaleDateString("pt-BR")}
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