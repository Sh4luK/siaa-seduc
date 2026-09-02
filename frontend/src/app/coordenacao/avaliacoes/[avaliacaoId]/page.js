"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function AvaliacaoDetalheCoordenacaoPage() {
  const { avaliacaoId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [avaliacao, setAvaliacao] = useState(null);
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

        const res = await fetch(`${API_BASE}/api/coordenacao/avaliacoes/${avaliacaoId}`);
        if (!res.ok) {
          const corpoErro = await res.text();
          let msg = `Falha ao carregar avaliação (status ${res.status})`;
          try {
            const json = JSON.parse(corpoErro);
            if (json.message) msg = json.message;
          } catch {}
          throw new Error(msg);
        }

        setAvaliacao(await res.json());
      } catch (error) {
        setErros([`Erro ao carregar avaliação: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [avaliacaoId, router]);

  function emitirPdf() {
    window.open(`${API_BASE}/api/coordenacao/avaliacoes/${avaliacaoId}/pdf`, "_blank");
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

  if (erros.length > 0 && !avaliacao) {
    return (
      <div className={styles.page}>
        <div className={styles.wrapper}>
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <button className={styles.voltarBotao} onClick={() => router.push("/coordenacao/avaliacoes")}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>{avaliacao.titulo}</h1>
            <p className={styles.subtitle}>
              {avaliacao.disciplina} — Turma {avaliacao.turma} · Prof(a). {avaliacao.professor} ·{" "}
              {new Date(avaliacao.data).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <button
            type="button"
            className={styles.voltarBotao}
            onClick={() => router.push("/coordenacao/avaliacoes")}
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

        <div className={styles.acoesBarra}>
          <button className={styles.acaoBotaoSecundario} onClick={emitirPdf}>
            Emitir PDF
          </button>
        </div>

        <div className={styles.secaoDivisor}>
          <h2 className={styles.secaoTitulo}>Questões</h2>
          <p className={styles.secaoSubtitulo}>{avaliacao.questoes.length} questões nesta avaliação.</p>
        </div>

        {avaliacao.questoes.map((q, index) => (
          <div key={q.id} className={styles.vinculoCard}>
            <div className={styles.vinculoHeader}>
              <span className={styles.vinculoNumero}>Questão {index + 1}</span>
              <span className={q.tipo === "OBJETIVA" ? styles.tipoAtivo : styles.tipoBotao}>
                {q.tipo === "OBJETIVA" ? "Objetiva" : "Subjetiva"}
              </span>
            </div>

            <p className={styles.enunciadoTexto}>{q.enunciado}</p>

            {q.imagem && <img src={q.imagem} alt="" className={styles.imagemPreview} />}

            {q.tipo === "OBJETIVA" && (
              <div className={styles.alternativas}>
                {q.alternativas.map((alt) => (
                  <div
                    key={alt.letra}
                    className={alt.correta ? styles.alternativaCorreta : styles.alternativaLinhaView}
                  >
                    <span className={styles.alternativaLetra}>{alt.letra})</span>
                    <span>{alt.texto}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}