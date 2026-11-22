"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";
import Image from "next/image";
import logo from "@/assets/logo.png";

const API_BASE = "/backend-api";

function urlImagem(src) {
  if (!src) return src;
  return src.startsWith("/media/") ? `${API_BASE}${src}` : src;
}

export default function CorrigirAvaliacaoPage() {
  const { avaliacaoId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [avaliacao, setAvaliacao] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [erros, setErros] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // estado por aluno: { [alunoId]: { arquivo, preview, nota, infoAberta } }
  const [cards, setCards] = useState({});
  const fileInputs = useRef({});

  useEffect(() => {
    async function init() {
      try {
        const [authRes, avalRes, corrRes] = await Promise.all([
          fetch(`${API_BASE}/api/teacher/auth`, { credentials: "include" }),
          fetch(`${API_BASE}/api/teacher/avaliacoes/${avaliacaoId}`, { credentials: "include" }),
          fetch(`${API_BASE}/api/teacher/avaliacoes/${avaliacaoId}/correcoes`, { credentials: "include" }),
        ]);

        if (authRes.status === 401) {
          router.push("/professor/login");
          return;
        }

        if (!avalRes.ok) {
          const body = await avalRes.json().catch(() => ({}));
          setErros([body.message || "Não foi possível carregar a avaliação."]);
          setLoading(false);
          return;
        }

        const avalData = await avalRes.json();
        setAvaliacao(avalData);

        if (corrRes.ok) {
          const corrData = await corrRes.json();
          setAlunos(corrData.alunos || []);
          const inicial = {};
          for (const item of corrData.alunos || []) {
            inicial[item.aluno.id] = {
              arquivo: null,
              preview: item.correcao?.imagem_url ? urlImagem(item.correcao.imagem_url) : null,
              nota: item.correcao?.nota ?? "",
              infoAberta: false,
            };
          }
          setCards(inicial);
        } else {
          const body = await corrRes.json().catch(() => ({}));
          setErros([body.message || "Não foi possível carregar os alunos da turma."]);
        }
      } catch {
        setErros(["Erro ao carregar dados."]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [avaliacaoId, router]);

  function atualizarCard(alunoId, patch) {
    setCards((prev) => ({ ...prev, [alunoId]: { ...prev[alunoId], ...patch } }));
  }

  function selecionarImagem(alunoId, file) {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    atualizarCard(alunoId, { arquivo: file, preview });
  }

  async function enviarCorrecao(item) {
    const alunoId = item.aluno.id;
    const card = cards[alunoId];
    if (!card) return false;

    const formData = new FormData();
    formData.append("aluno_id", alunoId);
    if (card.arquivo) formData.append("imagem", card.arquivo);
    if (card.nota !== "" && card.nota !== null && card.nota !== undefined) {
      formData.append("nota", String(card.nota));
    }

    const res = await fetch(`${API_BASE}/api/teacher/avaliacoes/${avaliacaoId}/correcoes/salvar`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Falha ao salvar correção.");
    }
    const data = await res.json();
    atualizarCard(alunoId, {
      arquivo: null,
      preview: data.imagem_url ? urlImagem(data.imagem_url) : card.preview,
      nota: data.nota ?? card.nota,
    });
    return true;
  }

  async function enviarTodas() {
    setEnviando(true);
    setErros([]);
    setEnviado(false);
    const falhas = [];
    for (const item of alunos) {
      const card = cards[item.aluno.id];
      const temNovidade = card && (card.arquivo || (card.nota !== "" && String(card.nota) !== String(item.correcao?.nota ?? "")));
      if (!temNovidade) continue;
      try {
        await enviarCorrecao(item);
      } catch (e) {
        falhas.push(`${item.aluno.nome_completo}: ${e.message}`);
      }
    }
    if (falhas.length > 0) {
      setErros(falhas);
    } else {
      setEnviado(true);
    }
    setEnviando(false);
  }

  const todasObjetivas = (() => {
    const qs = avaliacao?.questoes || [];
    if (qs.length === 0) return false;
    return qs.every((q) => {
      if (q.tipo !== "OBJETIVA") return false;
      const subs = q.subquestoes || [];
      return subs.every((sq) => sq.tipo === "OBJETIVA");
    });
  })();

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
            <h1 className={styles.title}>Corrigir Avaliação</h1>
            <p className={styles.subtitle}>
              {avaliacao ? `${avaliacao.titulo} — Turma ${avaliacao.turma}` : "Carregando..."}
            </p>
          </div>
          <button
            className={styles.voltarBotao}
            onClick={() => router.push(`/professor/avaliacoes/${avaliacaoId}`)}
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
        {enviado && <p className={styles.sucesso}>Notas e imagens enviadas com sucesso.</p>}

        <div className={styles.secaoDivisor}>
          <h2 className={styles.secaoTitulo}>Alunos da turma</h2>
          <p className={styles.secaoSubtitulo}>{alunos.length} aluno(s) nesta turma.</p>
        </div>

        <div className={styles.listaAlunos}>
          {alunos.map((item) => {
            const aluno = item.aluno;
            const card = cards[aluno.id] || {};
            return (
              <div key={aluno.id} className={styles.alunoCard}>
                <div className={styles.alunoHeader}>
                  <div>
                    <span className={styles.alunoNumero}>{aluno.posicao_ordem || ""}</span>
                    <h3 className={styles.alunoNome}>{aluno.nome_completo}</h3>
                    <p className={styles.alunoResumo}>
                      {[aluno.serie, aluno.curso, aluno.turma].filter(Boolean).join(" • ") || aluno.turma}
                    </p>
                  </div>
                  <button
                    className={styles.infoBotao}
                    onClick={() => atualizarCard(aluno.id, { infoAberta: !card.infoAberta })}
                  >
                    {card.infoAberta ? "Ocultar informações" : "Informações do aluno"}
                  </button>
                </div>

                {card.infoAberta && (
                  <div className={styles.infoDetalhes}>
                    <p><strong>Escola:</strong> {aluno.escola || "—"}</p>
                    <p><strong>Série:</strong> {aluno.serie || "—"}</p>
                    <p><strong>Período:</strong> {aluno.período || aluno.periodo || "—"}</p>
                    <p><strong>Curso:</strong> {aluno.curso || "—"}</p>
                    <p><strong>Turma:</strong> {aluno.turma || "—"}</p>
                    <p><strong>Modo de ensino:</strong> {aluno.modo_de_ensino || "—"}</p>
                    <p><strong>Data de cadastro:</strong> {aluno.data_cadastro ? new Date(aluno.data_cadastro).toLocaleDateString("pt-BR") : "—"}</p>
                  </div>
                )}

                <div className={styles.cardCorpo}>
                  {todasObjetivas ? (
                    <div className={styles.quadroGabarito}>
                      <p className={styles.rotuloQuadro}>Gabarito fotografado</p>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={(el) => { fileInputs.current[aluno.id] = el; }}
                        style={{ display: "none" }}
                        onChange={(e) => selecionarImagem(aluno.id, e.target.files?.[0])}
                      />
                      <button
                        className={styles.botaoCorrigir}
                        onClick={() => fileInputs.current[aluno.id]?.click()}
                      >
                        Corrigir Avaliação
                      </button>
                      {card.preview && (
                        <div className={styles.previewWrap}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={card.preview} alt={`Gabarito de ${aluno.nome_completo}`} className={styles.previewImg} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.quadroGabarito}>
                      <p className={styles.rotuloQuadro}>Correção manual</p>
                      <p className={styles.correcaoManualTexto}>
                        Esta avaliação possui questões subjetivas. A correção é feita de forma manual — informe a nota abaixo.
                      </p>
                    </div>
                  )}

                  <div className={styles.quadroNota}>
                    <p className={styles.rotuloNota}>Nota</p>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className={styles.inputNota}
                      placeholder="0,0"
                      value={card.nota ?? ""}
                      onChange={(e) => atualizarCard(aluno.id, { nota: e.target.value })}
                    />
                    {item.correcao?.nota != null && (
                      <p className={styles.notaSalva}>Última nota salva: {item.correcao.nota}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {alunos.length === 0 && erros.length === 0 && (
            <p className={styles.vazio}>Nenhum aluno encontrado para a turma desta avaliação.</p>
          )}
        </div>

        {alunos.length > 0 && (
          <div className={styles.rodapeAcoes}>
            <button className={styles.botaoEnviar} onClick={enviarTodas} disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar nota"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
