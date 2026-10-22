"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import layoutStyles from "../../page.module.css";
import styles from "./page.module.css";
import MarkdownContent from "@/app/components/MarkdownContent";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatarDataHora(dataISO) {
  return new Date(dataISO).toLocaleString("pt-BR");
}

function resolverUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

export default function GerenciarEnvioPage({ params }) {
  const { envioId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [envio, setEnvio] = useState(null);
  const [atividade, setAtividade] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

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

  async function salvarAlteracao(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setEnviando(true);
    setErro("");
    setMensagem("");

    try {
      const formData = new FormData(formElement);
      const res = await fetch(`${API_BASE}/api/students/atividades/${atividade.id}/enviar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.detail || `Falha ao atualizar (status ${res.status})`);

      setEnvio(data.envio);
      setMensagem(data.message);
      formElement.reset();
    } catch (error) {
      setErro(`Erro ao atualizar envio: ${error.message}`);
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <p className={layoutStyles.loadingText}>Carregando envio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={layoutStyles.page}>
      <main className={styles.main}>
        <section className={styles.card}>
          <Link href="/aluno/atividades" className={styles.voltar}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
            Voltar para atividades
          </Link>
          <header className={styles.cabecalho}>
            <span className={styles.sobretitulo}>Gerenciamento de envio</span>
            <h1 className={styles.titulo}>{atividade?.titulo || "Gerenciar envio"}</h1>
            {atividade?.disciplina && (
              <p className={styles.disciplina}>
                <i className="ti ti-book" aria-hidden="true" />
                {atividade.disciplina}
              </p>
            )}
          </header>

          {erro && <p className={styles.erro} role="alert">{erro}</p>}

          {envio && (
            <div className={styles.arquivoAtual}>
              <div className={styles.arquivoIcone}>
                <i className="ti ti-file-text" aria-hidden="true" />
              </div>
              <div className={styles.arquivoDetalhes}>
                <span className={styles.arquivoRotulo}>Envio atual</span>
                <span className={styles.arquivoData}>{formatarDataHora(envio.enviado_em)}</span>
                <a href={resolverUrl(envio.arquivo_url)} target="_blank" rel="noopener noreferrer">
                  <i className="ti ti-download" aria-hidden="true" />
                  {envio.arquivo_nome}
                </a>
                {envio.comentario && <MarkdownContent content={envio.comentario} collapsible />}
              </div>
            </div>
          )}

          {envio?.alteracao_status === "APROVADA" ? (
            <div className={styles.secaoEdicao}>
              <div className={`${styles.aviso} ${styles.avisoAprovado}`} role="status">
                <i className="ti ti-circle-check" aria-hidden="true" />
                <p>
                O professor autorizou um novo envio. Você pode substituir o arquivo atual por uma versão corrigida.
                </p>
              </div>
              <form className={styles.formulario} onSubmit={salvarAlteracao}>
                <div className={styles.campo}>
                  <label htmlFor="arquivo">Novo arquivo</label>
                  <input id="arquivo" name="arquivo" type="file" required />
                  <span className={styles.dica}>Selecione a versão corrigida para substituir o envio atual.</span>
                </div>
                <div className={styles.campo}>
                  <label htmlFor="comentario">Comentário <span>(opcional)</span></label>
                  <p>O comentário continua em Markdown para você editar.</p>
                  <textarea id="comentario" name="comentario" rows={4} defaultValue={envio.comentario} />
                </div>
                <button type="submit" disabled={enviando}>
                  <i className={`ti ${enviando ? "ti-loader-2" : "ti-upload"}`} aria-hidden="true" />
                  {enviando ? "Salvando..." : "Salvar novo envio"}
                </button>
              </form>
            </div>
          ) : (
            <div className={styles.aviso} role="status">
              <i className="ti ti-clock-hour-4" aria-hidden="true" />
              <p>
              {envio?.alteracao_status === "SOLICITADA"
                ? "Sua solicitação ainda está aguardando a resposta do professor."
                : "Não há autorização ativa para editar este envio."}
              </p>
            </div>
          )}

          {envio?.visto_emitido_em && envio.nota !== null && envio.nota !== undefined && (
            <p className={styles.nota}>Nota: <strong>{String(envio.nota).replace(".", ",")}</strong> / 10</p>
          )}
          {envio?.parecer_professor && (
            <div className={styles.arquivoAtual}>
              <span>Parecer do professor</span>
              <p>{envio.parecer_professor}</p>
              {envio.visto_emitido_em && (
                <span>Visto emitido em {formatarDataHora(envio.visto_emitido_em)}</span>
              )}
              {envio.visto_pdf_url && (
                <a href={resolverUrl(envio.visto_pdf_url)} target="_blank" rel="noopener noreferrer">
                  Abrir PDF com visto
                </a>
              )}
            </div>
          )}

          {mensagem && <p className={styles.sucesso} role="status">{mensagem}</p>}
        </section>
      </main>
    </div>
  );
}
