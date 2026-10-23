"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import layoutStyles from "../../../page.module.css";
import styles from "./page.module.css";
import MarkdownContent from "@/app/components/MarkdownContent";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatarDataHora(dataISO) {
  if (!dataISO) return "—";
  return new Date(dataISO).toLocaleString("pt-BR");
}

function resolverUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function obterStatus(envio) {
  if (envio.alteracao_status === "SOLICITADA") {
    return { texto: "Aguardando resposta", classe: styles.statusPendente, icone: "ti-clock-hour-4" };
  }
  if (envio.alteracao_status === "APROVADA") {
    return { texto: "Novo envio autorizado", classe: styles.statusAprovado, icone: "ti-circle-check" };
  }
  if (envio.alteracao_status === "NEGADA") {
    return { texto: "Solicitação negada", classe: styles.statusNegado, icone: "ti-circle-x" };
  }
  return envio.atrasado
    ? { texto: "Enviado com atraso", classe: styles.statusAtrasado, icone: "ti-alert-triangle" }
    : { texto: "Enviado", classe: styles.statusEnviado, icone: "ti-check" };
}

export default function DetalheEnvioAlunoPage({ params }) {
  const { envioId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [envio, setEnvio] = useState(null);
  const [atividade, setAtividade] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarEnvio() {
      try {
        const authRes = await fetch(`${API_BASE}/api/students/auth`, { credentials: "include" });
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/aluno/login");
          return;
        }

        const res = await fetch(`${API_BASE}/api/students/envios/${envioId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Falha ao carregar envio (status ${res.status})`);
        setEnvio(data.envio);
        setAtividade(data.atividade);
      } catch (error) {
        setErro(`Erro ao carregar envio: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    carregarEnvio();
  }, [envioId, router]);

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <p className={layoutStyles.loadingText}>Carregando envio...</p>
        </div>
      </div>
    );
  }

  const status = envio ? obterStatus(envio) : null;

  return (
    <div className={layoutStyles.page}>
      <main className={styles.main}>
        <Link href="/aluno/atividades/envios" className={styles.voltar}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
          Voltar para meus envios
        </Link>

        {erro ? (
          <div className={styles.erro} role="alert">
            <i className="ti ti-alert-circle" aria-hidden="true" />
            {erro}
          </div>
        ) : envio && atividade ? (
          <article className={styles.card}>
            <header className={styles.cabecalho}>
              <div>
                <span className={styles.sobretitulo}>Detalhes do envio</span>
                <h1 className={styles.titulo}>{atividade.titulo}</h1>
                <p className={styles.disciplina}>
                  {atividade.disciplina || "Atividade"}
                  {atividade.turma && ` · ${atividade.turma}`}
                </p>
              </div>
              <span className={`${styles.status} ${status.classe}`}>
                <i className={`ti ${status.icone}`} aria-hidden="true" />
                {status.texto}
              </span>
            </header>

            <div className={styles.dados}>
              <div className={styles.dado}>
                <span>Data do envio</span>
                <strong>{formatarDataHora(envio.enviado_em)}</strong>
              </div>
              <div className={styles.dado}>
                <span>Professor</span>
                <strong>{atividade.professor || "—"}</strong>
              </div>
              <div className={styles.dado}>
                <span>Prazo da atividade</span>
                <strong>{atividade.data_entrega || "Não informado"}</strong>
              </div>
              {envio.alteracao_solicitada_em && (
                <div className={styles.dado}>
                  <span>Solicitação de novo envio</span>
                  <strong>{formatarDataHora(envio.alteracao_solicitada_em)}</strong>
                </div>
              )}
            </div>

            {atividade.descricao && (
              <section className={styles.secao}>
                <h2>Descrição da atividade</h2>
                <p className={styles.texto}>{atividade.descricao}</p>
              </section>
            )}

            <section className={styles.secao}>
              <h2>Arquivo enviado</h2>
              <div className={styles.arquivo}>
                <div className={styles.arquivoIcone}>
                  <i className="ti ti-file-text" aria-hidden="true" />
                </div>
                <div className={styles.arquivoInfo}>
                  <strong>{envio.arquivo_nome || "Arquivo do envio"}</strong>
                  <span>Enviado em {formatarDataHora(envio.enviado_em)}</span>
                </div>
                <a
                  href={resolverUrl(envio.arquivo_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.botaoArquivo}
                >
                  <i className="ti ti-download" aria-hidden="true" />
                  Abrir arquivo
                </a>
              </div>
            </section>

            <section className={styles.secao}>
              <h2>Comentário</h2>
              {envio.comentario ? (
                <div className={styles.comentario}>
                  <MarkdownContent content={envio.comentario} collapsible />
                </div>
              ) : (
                <p className={styles.semComentario}>Nenhum comentário foi adicionado a este envio.</p>
              )}
            </section>

            {envio.visto_emitido_em && (
              <section className={styles.secao}>
                <div className={styles.assinaturaTitulo}>
                  <i className="ti ti-rosette-discount-check" aria-hidden="true" />
                  <div>
                    <h2>Correção e visto do professor</h2>
                    <p>Registrado em {formatarDataHora(envio.visto_emitido_em)}</p>
                  </div>
                </div>
                {envio.visto_emitido_em && envio.nota !== null && envio.nota !== undefined && (
                  <p className={styles.nota}>Nota: <strong>{String(envio.nota).replace(".", ",")}</strong> / 10</p>
                )}
                {envio.parecer_professor && (
                  <p className={styles.parecer}>{envio.parecer_professor}</p>
                )}
                <p className={styles.hash}>
                  Hash de autenticação HMAC-SHA256
                  <code>{envio.visto_assinatura}</code>
                </p>
                <a
                  href={resolverUrl(envio.visto_pdf_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.botaoVisto}
                >
                  <i className="ti ti-file-type-pdf" aria-hidden="true" />
                  Abrir PDF com visto
                </a>
                <p className={styles.notaAssinatura}>
                  Visto eletrônico interno do SIAA; não equivale a uma assinatura Gov.br ou ICP-Brasil.
                </p>
              </section>
            )}

            {envio.alteracao_status === "APROVADA" && (
              <div className={styles.aviso} role="status">
                <i className="ti ti-circle-check" aria-hidden="true" />
                <p>O professor autorizou um novo envio. Você pode editar este envio.</p>
                <Link href={`/aluno/atividades/${atividade.id}`} className={styles.botaoEditar}>
                  Ver atividade
                </Link>
              </div>
            )}
          </article>
        ) : null}
      </main>
    </div>
  );
}
