"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import layoutStyles from "../../page.module.css";
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

function statusEnvio(envio) {
  if (envio.alteracao_status === "SOLICITADA") return "Aguardando resposta";
  if (envio.alteracao_status === "APROVADA") return "Novo envio autorizado";
  if (envio.alteracao_status === "NEGADA") return "Solicitação negada";
  return envio.atrasado ? "Enviado com atraso" : "Enviado";
}

function classeStatus(envio) {
  if (envio.alteracao_status === "APROVADA") return styles.statusAprovado;
  if (envio.alteracao_status === "NEGADA") return styles.statusNegado;
  if (envio.alteracao_status === "SOLICITADA") return styles.statusPendente;
  return envio.atrasado ? styles.statusAtrasado : styles.statusEnviado;
}

export default function EnviosAlunoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [envios, setEnvios] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarEnvios() {
      try {
        const authRes = await fetch(`${API_BASE}/api/students/auth`, { credentials: "include" });
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/aluno/login");
          return;
        }

        const res = await fetch(`${API_BASE}/api/students/envios`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Falha ao carregar envios (status ${res.status})`);
        setEnvios(data.envios || []);
      } catch (error) {
        setErro(`Erro ao carregar envios: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    carregarEnvios();
  }, [router]);

  return (
    <div className={layoutStyles.page}>
      <main className={styles.main}>
        <Link href="/aluno/atividades" className={styles.voltar}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
          Voltar para atividades
        </Link>

        <header className={styles.cabecalho}>
          <div className={styles.cabecalhoIcone}>
            <i className="ti ti-folder-check" aria-hidden="true" />
          </div>
          <div>
            <p className={styles.sobretitulo}>Área do aluno</p>
            <h1 className={styles.titulo}>Meus envios</h1>
            <p className={styles.subtitulo}>Consulte os arquivos, comentários e status das atividades entregues.</p>
          </div>
        </header>

        {erro ? (
          <p className={styles.erro} role="alert">{erro}</p>
        ) : loading ? (
          <div className={styles.estadoVazio}>
            <span className={styles.carregando} aria-hidden="true" />
            <p>Carregando seus envios...</p>
          </div>
        ) : envios.length === 0 ? (
          <div className={styles.estadoVazio}>
            <i className="ti ti-inbox" aria-hidden="true" />
            <h2>Nenhum envio encontrado</h2>
            <p>Quando você enviar uma atividade, ela aparecerá nesta página.</p>
            <Link href="/aluno/atividades" className={styles.botaoPrincipal}>
              Ver atividades disponíveis
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.resumo}>
              <span>{envios.length}</span>
              {envios.length === 1 ? "atividade enviada" : "atividades enviadas"}
            </div>
            <ul className={styles.lista}>
              {envios.map((envio) => (
                <li key={envio.id} className={styles.card}>
                  <div className={styles.cardTopo}>
                    <div className={styles.cardIcone}>
                      <i className="ti ti-file-check" aria-hidden="true" />
                    </div>
                    <span className={`${styles.status} ${classeStatus(envio)}`}>
                      {statusEnvio(envio)}
                    </span>
                  </div>

                  <div className={styles.cardConteudo}>
                    <p className={styles.disciplina}>{envio.atividade.disciplina || "Atividade"}</p>
                    <h2>{envio.atividade.titulo}</h2>
                    <p className={styles.detalhes}>
                      {envio.atividade.turma}
                      {envio.atividade.professor && ` · ${envio.atividade.professor}`}
                    </p>
                  </div>

                  <div className={styles.arquivo}>
                    <i className="ti ti-paperclip" aria-hidden="true" />
                    <a href={resolverUrl(envio.arquivo_url)} target="_blank" rel="noopener noreferrer">
                      {envio.arquivo_nome}
                    </a>
                    <span>{formatarDataHora(envio.enviado_em)}</span>
                  </div>

                  {envio.comentario && (
                    <div className={styles.comentario}>
                      <span>Seu comentário</span>
                      <MarkdownContent content={envio.comentario} collapsible />
                    </div>
                  )}
                  {envio.parecer_professor && (
                    <div className={styles.parecer}>
                      <span>Parecer do professor</span>
                      <p>{envio.parecer_professor}</p>
                    </div>
                  )}
                  {envio.visto_pdf_url && (
                    <a
                      href={resolverUrl(envio.visto_pdf_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkVisto}
                    >
                      <i className="ti ti-file-type-pdf" aria-hidden="true" />
                      Ver PDF com visto
                    </a>
                  )}

                  <Link href={`/aluno/atividades/envios/${envio.id}`} className={styles.botaoDetalhes}>
                    Ver detalhes
                    <i className="ti ti-arrow-right" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
