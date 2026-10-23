"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import layoutStyles from "../../page.module.css";
import styles from "./page.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function resolverUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function tipoArquivo(nome = "") {
  const extensao = nome?.split(".").pop()?.toLowerCase();
  if (extensao === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(extensao)) return "imagem";
  return "outro";
}

function respostasIniciais(envio) {
  return Object.fromEntries(
    (envio?.respostas || []).map((resposta) => [
      resposta.questao_id,
      { alternativa_id: resposta.alternativa_id, texto: resposta.texto || "" },
    ])
  );
}

export default function AtividadeAlunoPage({ params }) {
  const { atividadeId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [atividade, setAtividade] = useState(null);
  const [envio, setEnvio] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [respostasLivres, setRespostasLivres] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [solicitandoAlteracao, setSolicitandoAlteracao] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function carregarAtividade() {
      try {
        const authRes = await fetch(`${API_BASE}/api/students/auth`, { credentials: "include" });
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/aluno/login");
          return;
        }

        const res = await fetch(`${API_BASE}/api/students/atividades/${atividadeId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Falha ao carregar atividade (status ${res.status})`);
        setAtividade(data.atividade);
        setEnvio(data.envio);
        setRespostas(respostasIniciais(data.envio));
        setRespostasLivres(
          (data.envio?.respostas_livres || []).map((resposta) => ({
            id: crypto.randomUUID(),
            questao: resposta.questao,
            resposta: resposta.resposta,
            confirmada: true,
          }))
        );
      } catch (error) {
        setErro(`Erro ao carregar atividade: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    carregarAtividade();
  }, [atividadeId, router]);

  function atualizarResposta(questaoId, valor) {
    setRespostas((anteriores) => ({
      ...anteriores,
      [questaoId]: { ...(anteriores[questaoId] || {}), ...valor },
    }));
  }

  function adicionarResposta() {
    setRespostasLivres((anteriores) => [
      ...anteriores,
      { id: crypto.randomUUID(), questao: "", resposta: "", confirmada: false },
    ]);
  }

  function atualizarRespostaLivre(id, campo, valor) {
    setRespostasLivres((anteriores) => anteriores.map((item) => (
      item.id === id ? { ...item, [campo]: valor } : item
    )));
  }

  function confirmarResposta(id) {
    const item = respostasLivres.find((resposta) => resposta.id === id);
    if (!item?.questao.trim() || !item.resposta.trim()) {
      setErro("Preencha a questão e a resposta antes de confirmar.");
      return;
    }
    atualizarRespostaLivre(id, "confirmada", true);
    setErro("");
  }

  async function enviarAtividade(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setErro("");
    setMensagem("");

    const questoes = atividade.questoes || [];
    const pendentes = questoes.filter((questao) => (
      questao.tipo === "OBJETIVA"
        ? !respostas[questao.id]?.alternativa_id
        : !respostas[questao.id]?.texto?.trim()
    ));
    if (pendentes.length) {
      setErro(`Responda todas as questões do professor antes de enviar (faltam ${pendentes.length}).`);
      return;
    }
    if (respostasLivres.some((item) => !item.confirmada)) {
      setErro("Confirme cada resposta adicional antes de enviar a atividade.");
      return;
    }
    const arquivoSelecionado = formElement.elements.namedItem("arquivo")?.files?.length > 0;
    if (!questoes.length && !respostasLivres.length && !arquivoSelecionado) {
      setErro("Selecione um arquivo ou adicione ao menos uma resposta.");
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData(formElement);
      if (questoes.length) {
        formData.append(
          "respostas",
          JSON.stringify(
            Object.entries(respostas).map(([questaoId, resposta]) => ({
              questao_id: Number(questaoId),
              ...resposta,
            }))
          )
        );
      }
      formData.append(
        "respostas_livres",
        JSON.stringify(respostasLivres.map(({ questao, resposta }) => ({ questao, resposta })))
      );

      const res = await fetch(`${API_BASE}/api/students/atividades/${atividadeId}/enviar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.detail || `Falha ao enviar (status ${res.status})`);
      setEnvio(data.envio);
      setMensagem(data.message || "Atividade enviada com sucesso.");
    } catch (error) {
      setErro(`Erro ao enviar atividade: ${error.message}`);
    } finally {
      setEnviando(false);
    }
  }

  async function solicitarNovoEnvio() {
    setSolicitandoAlteracao(true);
    setErro("");
    setMensagem("");
    try {
      const res = await fetch(
        `${API_BASE}/api/students/atividades/${atividadeId}/solicitar-alteracao`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Falha ao solicitar (status ${res.status})`);
      setEnvio((anterior) => ({
        ...anterior,
        alteracao_status: "SOLICITADA",
        alteracao_solicitada_em: new Date().toISOString(),
      }));
      setMensagem(data.message);
    } catch (error) {
      setErro(`Erro ao solicitar novo envio: ${error.message}`);
    } finally {
      setSolicitandoAlteracao(false);
    }
  }

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <p className={layoutStyles.loadingText}>Carregando atividade...</p>
        </div>
      </div>
    );
  }

  const podeEnviar = !envio || envio.alteracao_status === "APROVADA";
  const urlArquivo = resolverUrl(atividade?.arquivo_url);
  const tipo = tipoArquivo(atividade?.arquivo_nome);

  return (
    <div className={layoutStyles.page}>
      <main className={styles.main}>
        <Link href="/aluno/atividades" className={styles.voltar}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
          Voltar para atividades
        </Link>

        {erro && <p className={styles.erro} role="alert">{erro}</p>}
        {atividade && (
          <>
            <header className={styles.cabecalho}>
              <span className={styles.sobretitulo}>Atividade</span>
              <h1 className={styles.titulo}>{atividade.titulo}</h1>
              <p className={styles.subtitulo}>
                {atividade.disciplina} · {atividade.turma}
                {atividade.data_entrega && ` · Prazo: ${atividade.data_entrega}`}
              </p>
              {atividade.descricao && <p className={styles.descricao}>{atividade.descricao}</p>}
            </header>

            <section className={styles.card}>
              <div className={styles.secaoTitulo}>
                <i className="ti ti-paperclip" aria-hidden="true" />
                <div>
                  <h2>Material enviado pelo professor</h2>
                  {atividade.arquivo_nome && <p>{atividade.arquivo_nome}</p>}
                </div>
              </div>
              {urlArquivo ? (
                <>
                  <div className={styles.visualizador}>
                    {tipo === "pdf" ? (
                      <iframe src={urlArquivo} title={`Material da atividade ${atividade.titulo}`} />
                    ) : tipo === "imagem" ? (
                      <Image
                        src={urlArquivo}
                        alt={`Material da atividade ${atividade.titulo}`}
                        width={1200}
                        height={900}
                        unoptimized
                      />
                    ) : (
                      <div className={styles.semVisualizacao}>
                        <i className="ti ti-file-description" aria-hidden="true" />
                        <p>A visualização deste formato não está disponível.</p>
                      </div>
                    )}
                  </div>
                  <a className={styles.linkArquivo} href={urlArquivo} target="_blank" rel="noopener noreferrer">
                    <i className="ti ti-download" aria-hidden="true" />
                    Abrir ou baixar material
                  </a>
                </>
              ) : (
                <p className={styles.semArquivo}>O professor não anexou um arquivo a esta atividade.</p>
              )}
            </section>

            {envio?.arquivo_url && (
              <section className={styles.card}>
                <div className={styles.secaoTitulo}>
                  <i className="ti ti-file-check" aria-hidden="true" />
                  <div>
                    <h2>Arquivo enviado por você</h2>
                    <p>{envio.arquivo_nome}</p>
                  </div>
                </div>
                <a className={styles.linkArquivo} href={resolverUrl(envio.arquivo_url)} target="_blank" rel="noopener noreferrer">
                  Abrir arquivo enviado
                </a>
              </section>
            )}

            {podeEnviar ? (
              <section className={styles.card}>
                <div className={styles.secaoTitulo}>
                  <i className="ti ti-pencil" aria-hidden="true" />
                  <div>
                    <h2>{envio ? "Enviar nova versão" : "Sua resposta"}</h2>
                    <p>Responda às questões, anexe seu trabalho ou adicione respostas abaixo.</p>
                  </div>
                </div>

                <form className={styles.formulario} onSubmit={enviarAtividade}>
                  {(atividade.questoes || []).length > 0 && (
                    <ol className={styles.questoes}>
                      {atividade.questoes.map((questao, indice) => (
                        <li className={styles.questao} key={questao.id}>
                          <p className={styles.enunciado}>{indice + 1}. {questao.enunciado}</p>
                          {questao.tipo === "OBJETIVA" ? (
                            <div className={styles.alternativas}>
                              {questao.alternativas.map((alternativa) => (
                                <label key={alternativa.id} className={styles.alternativa}>
                                  <input
                                    type="radio"
                                    name={`questao-${questao.id}`}
                                    checked={respostas[questao.id]?.alternativa_id === alternativa.id}
                                    onChange={() => atualizarResposta(questao.id, { alternativa_id: alternativa.id })}
                                  />
                                  {alternativa.letra}) {alternativa.texto}
                                </label>
                              ))}
                            </div>
                          ) : (
                            <textarea
                              rows={4}
                              value={respostas[questao.id]?.texto || ""}
                              onChange={(event) => atualizarResposta(questao.id, { texto: event.target.value })}
                              placeholder="Escreva sua resposta..."
                              aria-label={`Resposta da questão ${indice + 1}`}
                            />
                          )}
                        </li>
                      ))}
                    </ol>
                  )}

                  <section className={styles.respostasLivres}>
                    <div className={styles.respostasCabecalho}>
                      <div>
                        <h3>Respostas por questão</h3>
                        <p>Adicione uma questão e escreva sua resposta para ela.</p>
                      </div>
                      <button type="button" className={styles.botaoSecundario} onClick={adicionarResposta}>
                        <i className="ti ti-plus" aria-hidden="true" />
                        Adicionar resposta
                      </button>
                    </div>

                    {respostasLivres.map((item, indice) => (
                      <div className={styles.respostaLivre} key={item.id}>
                        <label htmlFor={`questao-livre-${item.id}`}>Questão {indice + 1}</label>
                        <textarea
                          id={`questao-livre-${item.id}`}
                          rows={2}
                          value={item.questao}
                          readOnly={item.confirmada}
                          onChange={(event) => atualizarRespostaLivre(item.id, "questao", event.target.value)}
                          placeholder="Digite a questão..."
                        />
                        <label htmlFor={`resposta-livre-${item.id}`}>Sua resposta</label>
                        <textarea
                          id={`resposta-livre-${item.id}`}
                          rows={4}
                          value={item.resposta}
                          readOnly={item.confirmada}
                          onChange={(event) => atualizarRespostaLivre(item.id, "resposta", event.target.value)}
                          placeholder="Digite sua resposta..."
                        />
                        {item.confirmada ? (
                          <div className={styles.confirmacaoLinha}>
                            <p className={styles.confirmada} role="status">
                              <i className="ti ti-circle-check" aria-hidden="true" />
                              Resposta confirmada
                            </p>
                            <button
                              type="button"
                              className={styles.botaoEditarResposta}
                              onClick={() => atualizarRespostaLivre(item.id, "confirmada", false)}
                            >
                              Editar resposta
                            </button>
                          </div>
                        ) : (
                          <button type="button" className={styles.botaoConfirmar} onClick={() => confirmarResposta(item.id)}>
                            Confirmar resposta
                          </button>
                        )}
                      </div>
                    ))}
                  </section>

                  <div className={styles.campo}>
                    <label htmlFor="arquivo">Anexar arquivo <span>(opcional)</span></label>
                    <input id="arquivo" name="arquivo" type="file" />
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="comentario">Comentário <span>(opcional)</span></label>
                    <textarea id="comentario" name="comentario" rows={3} defaultValue={envio?.comentario || ""} />
                  </div>
                  <button className={styles.botaoEnviar} type="submit" disabled={enviando}>
                    <i className={`ti ${enviando ? "ti-loader-2" : "ti-send"}`} aria-hidden="true" />
                    {enviando ? "Enviando..." : "Enviar atividade"}
                  </button>
                </form>
              </section>
            ) : (
              <section className={styles.card}>
                <div className={`${styles.aviso} ${envio?.alteracao_status === "SOLICITADA" ? "" : styles.avisoOk}`}>
                  <i className={`ti ${envio?.alteracao_status === "SOLICITADA" ? "ti-clock-hour-4" : "ti-circle-check"}`} aria-hidden="true" />
                  <p>
                    {envio?.alteracao_status === "SOLICITADA"
                      ? "Sua solicitação de novo envio está aguardando a resposta do professor."
                      : "Sua atividade já foi enviada. Se precisar corrigir, solicite autorização ao professor."}
                  </p>
                </div>
                {(atividade.questoes || []).map((questao, indice) => {
                  const resposta = envio?.respostas?.find((item) => item.questao_id === questao.id);
                  const alternativa = questao.alternativas.find((item) => item.id === resposta?.alternativa_id);
                  return (
                    <div className={styles.respostaRecebida} key={questao.id}>
                      <strong>{indice + 1}. {questao.enunciado}</strong>
                      <p>
                        {questao.tipo === "OBJETIVA"
                          ? alternativa ? `${alternativa.letra}) ${alternativa.texto}` : "Sem resposta."
                          : resposta?.texto || "Sem resposta."}
                      </p>
                    </div>
                  );
                })}
                {envio?.alteracao_status !== "SOLICITADA" && !envio?.corrigido_em && (
                  <button
                    type="button"
                    className={styles.botaoSecundario}
                    onClick={solicitarNovoEnvio}
                    disabled={solicitandoAlteracao}
                  >
                    {solicitandoAlteracao ? "Solicitando..." : "Solicitar novo envio"}
                  </button>
                )}
                {(envio?.respostas_livres || []).map((item, indice) => (
                  <div className={styles.respostaRecebida} key={`${indice}-${item.questao}`}>
                    <strong>{item.questao}</strong>
                    <p>{item.resposta}</p>
                  </div>
                ))}
                {envio?.nota !== null && envio?.nota !== undefined && (
                  <p className={styles.nota}>Nota: {String(envio.nota).replace(".", ",")} / 10</p>
                )}
                {envio?.parecer_professor && <p className={styles.parecer}>{envio.parecer_professor}</p>}
              </section>
            )}

            {mensagem && <p className={styles.sucesso} role="status">{mensagem}</p>}
          </>
        )}
      </main>
    </div>
  );
}
