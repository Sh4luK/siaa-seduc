"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import logo from "../../../../../../assets/logo.png";
import layoutStyles from "../../../../page.module.css";
import styles from "./page.module.css";
import MarkdownContent from "@/app/components/MarkdownContent";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatarDataHora(dataISO) {
  return dataISO ? new Date(dataISO).toLocaleString("pt-BR") : "—";
}

function resolverUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function tipoArquivo(nome) {
  const extensao = nome?.split(".").pop()?.toLowerCase();
  if (extensao === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(extensao)) return "imagem";
  return "outro";
}

export default function CorrigirEnvioPage() {
  const { atividadeId, envioId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [atividade, setAtividade] = useState(null);
  const [envio, setEnvio] = useState(null);
  const [parecer, setParecer] = useState("");
  const [nota, setNota] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`, { credentials: "include" });
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/professor/login");
          return;
        }

        const res = await fetch(
          `${API_BASE}/api/teacher/atividades/${atividadeId}/envios/${envioId}/correcao`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Falha ao carregar envio (status ${res.status})`);
        setAtividade(data.atividade);
        setEnvio(data.envio);
        setParecer(data.envio.parecer_professor || "");
      } catch (error) {
        setErro(`Não foi possível carregar o envio: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [atividadeId, envioId, router]);

  async function registrarVisto(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      const res = await fetch(
        `${API_BASE}/api/teacher/atividades/${atividadeId}/envios/${envioId}/corrigir`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parecer, nota }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Falha ao emitir visto (status ${res.status})`);
      setEnvio((prev) => ({
        ...prev,
        parecer_professor: data.parecer_professor,
        nota: data.nota,
        visto_emitido_em: data.visto_emitido_em,
        visto_assinatura: data.visto_assinatura,
        visto_pdf_url: data.visto_pdf_url,
      }));
    } catch (error) {
      setErro(`Não foi possível registrar a correção: ${error.message}`);
    } finally {
      setSalvando(false);
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
          <p className={layoutStyles.loadingText}>Carregando envio…</p>
        </div>
      </div>
    );
  }

  const tipo = tipoArquivo(envio?.arquivo_nome);
  const arquivoUrl = resolverUrl(envio?.arquivo_url);

  return (
    <div className={layoutStyles.page}>
      <main className={styles.main}>
        <Link href={`/professor/atividades/${atividadeId}`} className={styles.voltar}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
          Voltar aos envios
        </Link>

        {erro && <p className={styles.erro} role="alert">{erro}</p>}
        {envio && atividade && (
          <>
            <header className={styles.cabecalho}>
              <div className={styles.cabecalhoIcone}>
                <i className="ti ti-clipboard-check" aria-hidden="true" />
              </div>
              <div>
                <span className={styles.sobretitulo}>Revisão do envio</span>
                <h1 className={styles.titulo}>{atividade.titulo}</h1>
                <p className={styles.subtitulo}>
                  {envio.aluno} · {atividade.turma} · {atividade.disciplina}
                </p>
              </div>
            </header>

            <section className={styles.card}>
              <div className={styles.resumoEnvio}>
                <div>
                  <span>Aluno</span>
                  <strong>{envio.aluno}</strong>
                </div>
                <div>
                  <span>Data de envio</span>
                  <strong>{formatarDataHora(envio.enviado_em)}</strong>
                </div>
                <div>
                  <span>Prazo</span>
                  <strong>{atividade.data_entrega || "Não informado"}</strong>
                </div>
              </div>

              <div className={styles.arquivoCabecalho}>
                <div>
                  <h2>Resposta enviada</h2>
                  <a href={arquivoUrl} target="_blank" rel="noopener noreferrer">
                    <i className="ti ti-download" aria-hidden="true" />
                    {envio.arquivo_nome}
                  </a>
                </div>
                <span className={styles.tipoArquivo}>
                  {tipo === "pdf" ? "PDF" : tipo === "imagem" ? "Imagem" : "Arquivo"}
                </span>
              </div>

              <div className={styles.visualizador}>
                {tipo === "pdf" ? (
                  <iframe src={arquivoUrl} title={`Arquivo enviado por ${envio.aluno}`} />
                ) : tipo === "imagem" ? (
                  <a href={arquivoUrl} target="_blank" rel="noopener noreferrer">
                    <img src={arquivoUrl} alt={`Arquivo enviado por ${envio.aluno}`} />
                  </a>
                ) : (
                  <div className={styles.semVisualizacao}>
                    <i className="ti ti-file-description" aria-hidden="true" />
                    <p>Este formato não pode ser exibido nesta página.</p>
                    <a href={arquivoUrl} target="_blank" rel="noopener noreferrer" download>
                      Baixar arquivo para revisar
                    </a>
                  </div>
                )}
              </div>

              <section className={styles.comentarioAluno}>
                <h2>Comentário do aluno</h2>
                {envio.comentario ? (
                  <MarkdownContent content={envio.comentario} collapsible />
                ) : (
                  <p>O aluno não adicionou comentário.</p>
                )}
              </section>
            </section>

            {envio.visto_emitido_em ? (
              <section className={`${styles.card} ${styles.cardAssinada}`}>
                <div className={styles.vistoCabecalho}>
                  <i className="ti ti-rosette-discount-check" aria-hidden="true" />
                  <div>
                    <h2>Correção assinada e registrada</h2>
                    <p>Emitida em {formatarDataHora(envio.visto_emitido_em)}</p>
                  </div>
                  {envio.nota !== null && envio.nota !== undefined && (
                    <span className={styles.notaSelo}>
                      Nota {String(envio.nota).replace(".", ",")}
                    </span>
                  )}
                </div>
                {envio.parecer_professor && (
                  <div className={styles.parecer}>
                    <span>Parecer registrado</span>
                    <p>{envio.parecer_professor}</p>
                  </div>
                )}
                <p className={styles.hash}>
                  HMAC-SHA256: <code>{envio.visto_assinatura}</code>
                </p>
                <a
                  href={resolverUrl(envio.visto_pdf_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.botaoPdf}
                >
                  <i className="ti ti-file-type-pdf" aria-hidden="true" />
                  Abrir PDF com visto
                </a>
              </section>
            ) : (
              <section className={styles.card}>
                <div className={styles.secaoTitulo}>
                  <div className={styles.secaoIcone}>
                    <i className="ti ti-edit" aria-hidden="true" />
                  </div>
                  <div>
                    <h2>Correção do professor</h2>
                    <p>Registre um parecer e emita um PDF consolidado com o visto.</p>
                  </div>
                </div>

                <form className={styles.formulario} onSubmit={registrarVisto}>
                  <label htmlFor="parecer">Parecer ou comentário de correção</label>
                  <textarea
                    id="parecer"
                    value={parecer}
                    onChange={(event) => setParecer(event.target.value)}
                    rows={5}
                    placeholder="Registre observações sobre o trabalho. Este parecer ficará incluído no PDF assinado."
                  />
                  <label htmlFor="nota">
                    Nota <span className={styles.opcional}>(0 a 10, opcional)</span>
                  </label>
                  <input
                    id="nota"
                    type="text"
                    inputMode="decimal"
                    className={styles.notaInput}
                    placeholder="Ex.: 8,5"
                    value={nota}
                    onChange={(event) => {
                      const valor = event.target.value;
                      if (valor === "" || (/^\d{0,2}([.,]\d{0,2})?$/.test(valor) && Number(valor.replace(",", ".")) <= 10)) {
                        setNota(valor);
                      }
                    }}
                  />
                  <p className={styles.avisoAssinatura}>
                    <i className="ti ti-shield-lock" aria-hidden="true" />
                    Ao emitir o visto, o parecer, a nota e o arquivo ficam registrados e não poderão ser alterados.
                    A autenticação HMAC do SIAA não é uma assinatura Gov.br ou ICP-Brasil.
                  </p>
                  <button type="submit" disabled={salvando}>
                    <i className={`ti ${salvando ? "ti-loader-2" : "ti-signature"}`} aria-hidden="true" />
                    {salvando ? "Gerando PDF e visto..." : "Registrar correção e dar visto"}
                  </button>
                </form>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
