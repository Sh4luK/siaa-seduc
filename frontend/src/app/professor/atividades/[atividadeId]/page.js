"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MarkdownContent from "@/app/components/MarkdownContent";
import logo from "../../../../assets/logo.png";
import layoutStyles from "../../page.module.css";
import styles from "./page.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatarDataHora(dataISO) {
  return new Date(dataISO).toLocaleString("pt-BR");
}

function resolverUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function RespostasDoAluno({ questoes, respostas }) {
  const porQuestao = Object.fromEntries(respostas.map((r) => [r.questao_id, r]));

  return (
    <ol className={styles.respostas}>
      {questoes.map((q) => {
        const resposta = porQuestao[q.id];
        const escolhida = q.alternativas.find((a) => a.id === resposta?.alternativa_id);
        const certa = q.alternativas.find((a) => a.correta);

        return (
          <li key={q.id} className={styles.resposta}>
            <p className={styles.enunciado}>{q.enunciado}</p>
            {q.tipo === "OBJETIVA" ? (
              escolhida ? (
                <p className={resposta.correta ? styles.respostaCerta : styles.respostaErrada}>
                  {resposta.correta ? "✓" : "✗"} {escolhida.letra}) {escolhida.texto}
                  {!resposta.correta && certa && (
                    <span className={styles.gabarito}> · correta: {certa.letra}) {certa.texto}</span>
                  )}
                </p>
              ) : (
                <p className={styles.semResposta}>Sem resposta</p>
              )
            ) : resposta?.texto ? (
              <p className={styles.respostaTexto}>{resposta.texto}</p>
            ) : (
              <p className={styles.semResposta}>Sem resposta</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function EnviosAtividadePage() {
  const { atividadeId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [atividade, setAtividade] = useState(null);
  const [envios, setEnvios] = useState([]);
  const [respostasVisiveis, setRespostasVisiveis] = useState({});
  const [erro, setErro] = useState("");
  const [respondendoId, setRespondendoId] = useState(null);

  useEffect(() => {
    async function carregarEnvios() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`, { credentials: "include" });
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/professor/login");
          return;
        }

        const res = await fetch(
          `${API_BASE}/api/teacher/atividades/${atividadeId}/envios`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Falha ao buscar envios (status ${res.status})`);
        setAtividade(data.atividade);
        setEnvios(data.envios || []);
      } catch (error) {
        setErro(`Erro ao carregar envios: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    carregarEnvios();
  }, [atividadeId, router]);

  async function responderSolicitacao(envioId, acao) {
    setRespondendoId(envioId);
    setErro("");
    try {
      const res = await fetch(
        `${API_BASE}/api/teacher/atividades/${atividadeId}/envios/${envioId}/solicitacao`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acao }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Falha ao responder (status ${res.status})`);

      setEnvios((prev) => prev.map((envio) => (
        envio.id === envioId
          ? { ...envio, alteracao_status: data.alteracao_status }
          : envio
      )));
    } catch (error) {
      setErro(`Erro ao responder à solicitação: ${error.message}`);
    } finally {
      setRespondendoId(null);
    }
  }

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}>
            <span className={layoutStyles.loadingBarFill} />
          </div>
          <p className={layoutStyles.loadingText}>Carregando envios…</p>
        </div>
      </div>
    );
  }

  const questoes = atividade?.questoes || [];
  const corrigidos = envios.filter((e) => e.visto_emitido_em).length;

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.content}>
        <main className={layoutStyles.main}>
          <div className={styles.wrapper}>
            <div className={styles.headerRow}>
              <div>
                <h1 className={styles.title}>{atividade?.titulo || "Envios da atividade"}</h1>
                {atividade && (
                  <p className={styles.subtitle}>
                    {atividade.nome_turma} · {atividade.disciplina}
                    {atividade.data_entrega && ` · Prazo: ${atividade.data_entrega}`}
                    {questoes.length > 0 && ` · ${questoes.length} questão(ões) na plataforma`}
                  </p>
                )}
              </div>
              <button
                type="button"
                className={styles.voltarBotao}
                onClick={() => router.push("/professor/atividades")}
              >
                Voltar
              </button>
            </div>

            {erro ? (
              <p className={styles.erro}>{erro}</p>
            ) : envios.length === 0 ? (
              <p className={styles.vazio}>Nenhum aluno enviou esta atividade ainda.</p>
            ) : (
              <>
                <p className={styles.resumo}>
                  {envios.length} {envios.length === 1 ? "envio recebido" : "envios recebidos"}
                  {" · "}
                  {corrigidos} com visto
                </p>
                <ul className={styles.lista}>
                  {envios.map((envio) => (
                    <li key={envio.id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <h2 className={styles.aluno}>{envio.aluno}</h2>
                        <div className={styles.selos}>
                          {envio.atrasado && <span className={styles.atrasado}>Enviado com atraso</span>}
                          {envio.visto_emitido_em ? (
                            <span className={styles.corrigido}>Visto emitido</span>
                          ) : (
                            <span className={styles.aguardando}>Aguardando correção</span>
                          )}
                          {envio.alteracao_status === "SOLICITADA" && (
                            <span className={styles.solicitada}>Solicitação de alteração</span>
                          )}
                          {envio.alteracao_status === "APROVADA" && (
                            <span className={styles.aprovada}>Alteração aprovada</span>
                          )}
                          {envio.alteracao_status === "NEGADA" && (
                            <span className={styles.negada}>Alteração negada</span>
                          )}
                        </div>
                      </div>
                      <p className={styles.dataEnvio}>
                        Enviado em {formatarDataHora(envio.enviado_em)}
                        {envio.total_objetivas > 0 && (
                          <> · {envio.acertos}/{envio.total_objetivas} objetivas certas</>
                        )}
                      </p>

                      {(questoes.length > 0 || envio.respostas_livres?.length > 0) && (
                        <>
                          <button
                            type="button"
                            className={styles.botaoVerRespostas}
                            aria-expanded={Boolean(respostasVisiveis[envio.id])}
                            onClick={() => setRespostasVisiveis((atuais) => ({
                              ...atuais,
                              [envio.id]: !atuais[envio.id],
                            }))}
                          >
                            <i
                              className={`ti ${respostasVisiveis[envio.id] ? "ti-chevron-up" : "ti-eye"}`}
                              aria-hidden="true"
                            />
                            {respostasVisiveis[envio.id] ? "Ocultar respostas" : "Ver Respostas"}
                          </button>
                          {respostasVisiveis[envio.id] && (
                            <div className={styles.respostasEnvio}>
                              {questoes.length > 0 && (
                                <RespostasDoAluno questoes={questoes} respostas={envio.respostas || []} />
                              )}

                              {envio.respostas_livres?.length > 0 && (
                                <ol className={styles.respostas}>
                                  {envio.respostas_livres.map((resposta, indice) => (
                                    <li className={styles.resposta} key={`${indice}-${resposta.questao}`}>
                                      <p className={styles.enunciado}>
                                        {resposta.enunciado || resposta.questao}
                                      </p>
                                      <p className={styles.respostaTexto}>
                                        {resposta.resposta || (resposta.pulado ? "Questão pulada." : "Sem resposta.")}
                                      </p>
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {envio.comentario && (
                        <div className={styles.comentario}>
                          <MarkdownContent content={envio.comentario} />
                        </div>
                      )}

                      {envio.arquivo_url && (
                        <a
                          className={styles.arquivoLink}
                          href={resolverUrl(envio.arquivo_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          Baixar {envio.arquivo_nome}
                        </a>
                      )}

                      {envio.alteracao_status === "SOLICITADA" && (
                        <section className={styles.solicitacao}>
                          <div>
                            <h3>Pedido para alterar o envio</h3>
                            {envio.alteracao_solicitada_em && (
                              <p>Solicitado em {formatarDataHora(envio.alteracao_solicitada_em)}</p>
                            )}
                          </div>
                          <div className={styles.acoesSolicitacao}>
                            <button
                              type="button"
                              className={styles.aprovarBotao}
                              onClick={() => responderSolicitacao(envio.id, "aprovar")}
                              disabled={respondendoId === envio.id}
                            >
                              Aprovar
                            </button>
                            <button
                              type="button"
                              className={styles.negarBotao}
                              onClick={() => responderSolicitacao(envio.id, "negar")}
                              disabled={respondendoId === envio.id}
                            >
                              Negar
                            </button>
                          </div>
                        </section>
                      )}
                      {envio.comentario && (
                        <div className={styles.comentario}>
                          <MarkdownContent content={envio.comentario} collapsible />
                        </div>
                      )}
                      {envio.visto_pdf_url && (
                        <a
                          className={styles.pdfVistoLink}
                          href={resolverUrl(envio.visto_pdf_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="ti ti-file-type-pdf" aria-hidden="true" />
                          Baixar PDF com visto
                        </a>
                      )}
                      <Link
                        className={styles.correcaoLink}
                        href={`/professor/atividades/${atividadeId}/corrigir/${envio.id}`}
                      >
                        <i className={`ti ${envio.visto_emitido_em ? "ti-file-check" : "ti-writing"}`} aria-hidden="true" />
                        {envio.visto_emitido_em ? "Ver correção e visto" : "Corrigir e dar visto"}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
