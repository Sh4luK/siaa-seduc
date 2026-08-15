"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function hoje() {
  return new Date();
}

export default function CalendarioCoordenacaoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [mesAtual, setMesAtual] = useState(hoje().getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(hoje().getFullYear());
  const [eventos, setEventos] = useState([]);
  const [erros, setErros] = useState([]);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [deletandoId, setDeletandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          setAuthenticated(false);
          router.push("/coordenacao/login");
          return;
        }
        setAuthenticated(true);
      } catch (error) {
        setErros([`Erro ao autenticar: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  useEffect(() => {
    if (!authenticated) return;

    async function carregarEventos() {
      setCarregando(true);
      setErros([]);

      try {
        const mesFormatado = String(mesAtual).padStart(2, "0");
        const url = `${API_BASE}/api/coordenacao/calendario/eventos?mes=${mesFormatado}&ano=${anoAtual}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Falha ao buscar eventos (status ${res.status})`);
        const data = await res.json();

        setEventos(data.eventos || []);
      } catch (error) {
        setErros([`Erro ao carregar eventos: ${error.message}`]);
      } finally {
        setCarregando(false);
      }
    }

    carregarEventos();
  }, [authenticated, mesAtual, anoAtual]);

  function mesAnterior() {
    if (mesAtual === 1) {
      setMesAtual(12);
      setAnoAtual((a) => a - 1);
    } else {
      setMesAtual((m) => m - 1);
    }
  }

  function proximoMes() {
    if (mesAtual === 12) {
      setMesAtual(1);
      setAnoAtual((a) => a + 1);
    } else {
      setMesAtual((m) => m + 1);
    }
  }

  async function handleDeletar(eventoId) {
    setDeletandoId(eventoId);
    setErros([]);
    setMensagemSucesso(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/coordenacao/calendario/eventos/${eventoId}/deletar`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`Falha ao remover (status ${res.status})`);

      const data = await res.json();
      setEventos((prev) => prev.filter((e) => e.id !== eventoId));
      setMensagemSucesso(data.message);
    } catch (error) {
      setErros([`Erro ao remover evento: ${error.message}`]);
    } finally {
      setDeletandoId(null);
      setConfirmandoId(null);
    }
  }

  const eventosPorDia = {};
  for (const evento of eventos) {
    const dia = Number(evento.data.split("-")[2]);
    if (!eventosPorDia[dia]) eventosPorDia[dia] = [];
    eventosPorDia[dia].push(evento);
  }

  const diasNoMes = new Date(anoAtual, mesAtual, 0).getDate();
  const primeiroDiaSemana = new Date(anoAtual, mesAtual - 1, 1).getDay();
  const celulasVazias = Array.from({ length: primeiroDiaSemana });
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1);

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <p className={styles.subtituloLoading}>Verificando credenciais…</p>
      </div>
    );
  }

  if (authenticated !== true) return null;

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <Link href="/coordenacao" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Coordenação
        </Link>

        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Calendário escolar</h1>
            <p className={styles.subtitle}>Eventos e datas importantes da escola.</p>
          </div>
          <Link href="/coordenacao/calendario/novo" className={styles.novoBotao}>
            + Novo evento
          </Link>
        </div>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        {mensagemSucesso && <p className={styles.mensagemSucesso}>{mensagemSucesso}</p>}

        <div className={styles.navegacaoMes}>
          <button className={styles.navMesBotao} onClick={mesAnterior} aria-label="Mês anterior">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6l6 6" />
            </svg>
          </button>
          <span className={styles.mesLabel}>{MESES[mesAtual - 1]} de {anoAtual}</span>
          <button className={styles.navMesBotao} onClick={proximoMes} aria-label="Próximo mês">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6l-6 6" />
            </svg>
          </button>
        </div>

        {carregando ? (
          <p className={styles.subtitle}>Carregando eventos...</p>
        ) : (
          <>
            <div className={styles.calendarioGrid}>
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
                <div key={dia} className={styles.diaSemanaLabel}>{dia}</div>
              ))}

              {celulasVazias.map((_, i) => (
                <div key={`vazio-${i}`} className={styles.diaCelulaVazia} />
              ))}

              {dias.map((dia) => {
                const eventosDoDia = eventosPorDia[dia] || [];
                const isHoje =
                  dia === hoje().getDate() &&
                  mesAtual === hoje().getMonth() + 1 &&
                  anoAtual === hoje().getFullYear();

                return (
                  <div
                    key={dia}
                    className={`${styles.diaCelula} ${isHoje ? styles.diaCelulaHoje : ""}`}
                  >
                    <span className={styles.diaNumero}>{dia}</span>
                    {eventosDoDia.map((evento) => (
                      <div key={evento.id} className={styles.eventoTag} title={evento.titulo}>
                        {evento.titulo}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className={styles.listaEventosSection}>
              <h2 className={styles.listaEventosTitulo}>Eventos do mês</h2>

              {eventos.length === 0 ? (
                <p className={styles.vazio}>Nenhum evento cadastrado para este mês.</p>
              ) : (
                <ul className={styles.eventosList}>
                  {eventos
                    .slice()
                    .sort((a, b) => a.data.localeCompare(b.data))
                    .map((evento) => {
                      const confirmando = confirmandoId === evento.id;

                      return (
                        <li key={evento.id} className={styles.eventoCard}>
                          <div className={styles.eventoCardData}>
                            {evento.data.split("-")[2]}
                            <span>{MESES[Number(evento.data.split("-")[1]) - 1].slice(0, 3)}</span>
                          </div>
                          <div className={styles.eventoCardInfo}>
                            <p className={styles.eventoCardTitulo}>{evento.titulo}</p>
                            {evento.nome_turma && (
                              <span className={styles.eventoCardBadge}>{evento.nome_turma}</span>
                            )}
                            {evento.descricao && (
                              <p className={styles.eventoCardDescricao}>{evento.descricao}</p>
                            )}
                          </div>

                          {!confirmando ? (
                            <div className={styles.eventoAcoes}>
                              <Link
                                href={`/coordenacao/calendario/${evento.id}/editar`}
                                className={styles.editarBotao}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
                                  <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
                                </svg>
                              </Link>
                              <button
                                type="button"
                                className={styles.apagarBotao}
                                onClick={() => setConfirmandoId(evento.id)}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 6l-12 12" />
                                  <path d="M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className={styles.confirmacaoWrapper}>
                              <button
                                type="button"
                                className={styles.confirmarBotao}
                                onClick={() => handleDeletar(evento.id)}
                                disabled={deletandoId === evento.id}
                              >
                                {deletandoId === evento.id ? "..." : "Sim"}
                              </button>
                              <button
                                type="button"
                                className={styles.cancelarBotao}
                                onClick={() => setConfirmandoId(null)}
                                disabled={deletandoId === evento.id}
                              >
                                Não
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}