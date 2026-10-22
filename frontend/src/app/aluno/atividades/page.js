"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import MarkdownContent from "@/app/components/MarkdownContent";
import logo from "../../../assets/logo.png";
import layoutStyles from "../page.module.css";
import styles from "./page.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatarData(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function respostasIniciais(envio) {
  return Object.fromEntries(
    (envio?.respostas || []).map((r) => [r.questao_id, { alternativa_id: r.alternativa_id, texto: r.texto }])
  );
}

// Questões da atividade respondidas na plataforma
function Questoes({ atividadeId, questoes, respostas, onChange, correcao }) {
  return (
    <ol className={styles.questoes}>
      {questoes.map((q) => {
        const resposta = respostas[q.id] || {};
        const resultado = correcao?.find((r) => r.questao_id === q.id);
        return (
          <li key={q.id} className={styles.questao}>
            <p className={styles.enunciado}>{q.enunciado}</p>
            {q.tipo === "OBJETIVA" ? (
              <div className={styles.alternativas} role="radiogroup">
                {q.alternativas.map((alt) => {
                  const marcada = resposta.alternativa_id === alt.id;
                  let classe = styles.alternativa;
                  if (correcao && marcada) {
                    classe += ` ${resultado?.correta ? styles.alternativaCerta : styles.alternativaErrada}`;
                  }
                  return (
                    <label key={alt.id} className={classe}>
                      <input
                        type="radio"
                        name={`q-${atividadeId}-${q.id}`}
                        checked={marcada}
                        disabled={Boolean(correcao)}
                        onChange={() => onChange(q.id, { alternativa_id: alt.id })}
                      />
                      <span className={styles.letra}>{alt.letra})</span> {alt.texto}
                    </label>
                  );
                })}
              </div>
            ) : (
              <textarea
                className={styles.respostaTexto}
                rows={3}
                aria-label="Sua resposta"
                placeholder="Escreva sua resposta..."
                value={resposta.texto || ""}
                readOnly={Boolean(correcao)}
                onChange={(e) => onChange(q.id, { texto: e.target.value })}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function AtividadesAlunoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [turma, setTurma] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [atividades, setAtividades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erros, setErros] = useState([]);
  const [enviandoId, setEnviandoId] = useState(null);
  const [mensagensEnvio, setMensagensEnvio] = useState({});
  // respostas[atividadeId][questaoId] = { alternativa_id } | { texto }
  const [respostas, setRespostas] = useState({});
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/students/auth`, { credentials: "include" });
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/aluno/login");
          return;
        }
        setAuthenticated(true);
        setNomeCompleto(authData.student?.nome_completo || "");
        setTurma(authData.student?.turma || "");

        const res = await fetch(`${API_BASE}/api/students/atividades`, { credentials: "include" });
        if (!res.ok) throw new Error(`Falha ao buscar atividades (status ${res.status})`);
        const data = await res.json();
        const lista = data.atividades || [];
        setAtividades(lista);
        setRespostas(Object.fromEntries(lista.map((a) => [a.id, respostasIniciais(a.envio)])));
      } catch (error) {
        setErros([`Erro ao carregar atividades: ${error.message}`]);
      } finally {
        setLoading(false);
        setCarregando(false);
      }
    }
    init();
  }, [router]);

  function responder(atividadeId, questaoId, valor) {
    setRespostas((prev) => ({
      ...prev,
      [atividadeId]: { ...(prev[atividadeId] || {}), [questaoId]: valor },
    }));
  }

  async function enviarAtividade(event, atividade) {
    event.preventDefault();
    const atividadeId = atividade.id;
    const formElement = event.currentTarget;
    const minhas = respostas[atividadeId] || {};

    const faltando = atividade.questoes.filter((q) => {
      const r = minhas[q.id];
      return q.tipo === "OBJETIVA" ? !r?.alternativa_id : !r?.texto?.trim();
    });
    if (faltando.length) {
      setMensagensEnvio((prev) => ({
        ...prev,
        [atividadeId]: `Responda todas as questões antes de enviar (faltam ${faltando.length}).`,
      }));
      return;
    }

    setEnviandoId(atividadeId);
    setMensagensEnvio((prev) => ({ ...prev, [atividadeId]: "" }));

    try {
      const formData = new FormData(formElement);
      if (atividade.questoes.length) {
        formData.append(
          "respostas",
          JSON.stringify(Object.entries(minhas).map(([questaoId, r]) => ({ questao_id: Number(questaoId), ...r })))
        );
      }
      const res = await fetch(
        `${API_BASE}/api/students/atividades/${atividadeId}/enviar`,
        { method: "POST", credentials: "include", body: formData }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.detail || `Falha ao enviar (status ${res.status})`);

      setAtividades((prev) => prev.map((atividade) => (
        atividade.id === atividadeId
          ? { ...atividade, envio: data.envio }
          : atividade
      )));
      formElement.reset();
      setMensagensEnvio((prev) => ({ ...prev, [atividadeId]: data.message }));
    } catch (error) {
      setMensagensEnvio((prev) => ({ ...prev, [atividadeId]: `Erro ao enviar: ${error.message}` }));
    } finally {
      setEnviandoId(null);
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
          <p className={layoutStyles.loadingText}>Carregando atividades…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.shell}>
        <aside className={`${layoutStyles.sidebar} ${menuOpen ? layoutStyles.sidebarOpen : ""}`}>
          <div className={layoutStyles.sidebarHeader}>
            <Image src={logo} alt="Logo do SIAA" className={layoutStyles.sidebarLogo} priority />
            <span className={layoutStyles.sidebarBrand}>SIAA</span>
          </div>

          <nav className={layoutStyles.nav}>
            <Link href="/aluno" className={layoutStyles.navLink}>
              <i className="ti ti-home" aria-hidden="true" />
              Início
            </Link>
            <Link href="/aluno/conteudos" className={layoutStyles.navLink}>
              <i className="ti ti-book" aria-hidden="true" />
              Conteúdos
            </Link>
            <Link href="/aluno/atividades" className={layoutStyles.navLinkActive}>
              <i className="ti ti-clipboard-list" aria-hidden="true" />
              Atividades
            </Link>
            <Link href="/aluno/frequencia" className={layoutStyles.navLink}>
              <i className="ti ti-calendar-stats" aria-hidden="true" />
              Frequência
            </Link>
            <Link href="/aluno/boletim" className={layoutStyles.navLink}>
              <i className="ti ti-report" aria-hidden="true" />
              Boletim
            </Link>
            <Link href="/aluno/cronograma" className={layoutStyles.navLink}>
              <i className="ti ti-calendar" aria-hidden="true" />
              Cronograma
            </Link>
            <Link href="/aluno/horarios" className={layoutStyles.navLink}>
              <i className="ti ti-clock" aria-hidden="true" />
              Horários
            </Link>
            <Link href="/aluno/solicitacoes" className={layoutStyles.navLink}>
              <i className="ti ti-users-group" aria-hidden="true" />
              Responsáveis
            </Link>
          </nav>

          <div className={layoutStyles.sidebarFooter}>
            <span className={layoutStyles.studentName}>{nomeCompleto}</span>
            <span className={layoutStyles.studentClass}>{turma}</span>
          </div>
        </aside>

        {menuOpen && (
          <button className={layoutStyles.overlay} aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />
        )}

        <div className={layoutStyles.content}>
          <header className={layoutStyles.topbar}>
            <button className={layoutStyles.menuButton} aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            <span className={layoutStyles.topbarTitle}>Atividades</span>
          </header>

          <main className={layoutStyles.main}>
            <h1 className={layoutStyles.greeting}>Atividades</h1>
            <p className={layoutStyles.subtitle}>Trabalhos e tarefas dos seus professores.</p>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}

            {carregando ? (
              <p className={styles.subtitle}>Carregando...</p>
            ) : atividades.length === 0 ? (
              <p className={styles.vazio}>Nenhuma atividade publicada ainda.</p>
            ) : (
              <ul className={styles.lista}>
                {atividades.map((a) => (
                  <li key={a.id} className={styles.card}>
                    <div className={styles.cardIcone}>
                      <i className="ti ti-clipboard-list" aria-hidden="true" />
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardTopo}>
                        <p className={styles.cardTitulo}>{a.titulo}</p>
                        {a.envio?.corrigido_em ? (
                          <span className={styles.badgeCorrigida}>Corrigida</span>
                        ) : a.envio ? (
                          <span className={styles.badgeEnviada}>
                            {a.envio.atrasado ? "Enviada com atraso" : "Enviada"}
                          </span>
                        ) : a.status && (
                          <span className={a.status === "atrasado" ? styles.badgeAtrasado : styles.badgePendente}>
                            {a.status === "atrasado" ? "Em atraso" : "Pendente"}
                          </span>
                        )}
                      </div>
                      {a.disciplina && <span className={styles.disciplinaBadge}>{a.disciplina}</span>}
                      {a.descricao && <p className={styles.cardDescricao}>{a.descricao}</p>}
                      {a.data_entrega && (
                        <p className={styles.cardMeta}>Entrega: {formatarData(a.data_entrega)}</p>
                      )}
                      {a.arquivo && (
                        <a href={a.arquivo} target="_blank" rel="noopener noreferrer" className={styles.arquivoLink}>
                          <i className="ti ti-paperclip" aria-hidden="true" /> Abrir arquivo
                        </a>
                      )}
                      {a.envio && (
                        <div className={styles.envioAtual}>
                          <p>Último envio: {formatarData(a.envio.enviado_em.slice(0, 10))}</p>
                          {a.envio.arquivo_url && (
                            <a href={`${API_BASE}${a.envio.arquivo_url}`} target="_blank" rel="noopener noreferrer">
                              {a.envio.arquivo_nome}
                            </a>
                          )}
                          {a.envio.comentario && <MarkdownContent content={a.envio.comentario} />}
                        </div>
                      )}

                      {a.envio?.corrigido_em ? (
                        <>
                          {a.questoes.length > 0 && (
                            <Questoes
                              atividadeId={a.id}
                              questoes={a.questoes}
                              respostas={respostas[a.id] || {}}
                              correcao={a.envio.respostas}
                            />
                          )}
                          <div className={styles.devolutiva}>
                            <div className={styles.devolutivaTopo}>
                              <span>Devolutiva do professor</span>
                              {a.envio.nota !== null && (
                                <span className={styles.devolutivaNota}>Nota {a.envio.nota}</span>
                              )}
                            </div>
                            {a.envio.total_objetivas > 0 && (
                              <p className={styles.devolutivaAcertos}>
                                Você acertou {a.envio.acertos} de {a.envio.total_objetivas} questão(ões) objetiva(s).
                              </p>
                            )}
                            {a.envio.feedback && <p className={styles.devolutivaTexto}>{a.envio.feedback}</p>}
                          </div>
                        </>
                      ) : (
                        <form
                          className={styles.formEnvio}
                          onSubmit={(event) => enviarAtividade(event, a)}
                        >
                          {a.questoes.length > 0 && (
                            <Questoes
                              atividadeId={a.id}
                              questoes={a.questoes}
                              respostas={respostas[a.id] || {}}
                              onChange={(questaoId, valor) => responder(a.id, questaoId, valor)}
                            />
                          )}
                          <label htmlFor={`arquivo-${a.id}`}>
                            Arquivo {a.questoes.length > 0 || a.envio?.arquivo_url ? "(opcional)" : ""}
                          </label>
                          <input id={`arquivo-${a.id}`} name="arquivo" type="file" />
                          <label htmlFor={`comentario-${a.id}`}>
                            {a.questoes.length > 0 ? "Comentário (opcional)" : "Resposta ou comentário"}
                          </label>
                          <textarea id={`comentario-${a.id}`} name="comentario" rows={2} />
                          <button type="submit" disabled={enviandoId === a.id}>
                            {enviandoId === a.id
                              ? "Enviando..."
                              : a.envio ? "Atualizar envio" : "Enviar atividade"}
                          </button>
                          {mensagensEnvio[a.id] && (
                            <p role="status">{mensagensEnvio[a.id]}</p>
                          )}
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}