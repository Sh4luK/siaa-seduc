"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

// TODO: ajuste este import/constante para bater com o padrão usado no resto do
// projeto (ex.: import { API_BASE } from "@/lib/config"). Mantive um fallback
// aqui só para o arquivo não quebrar caso você cole direto.
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev";

function formatarData(dataStr) {
  if (!dataStr) return "";
  const d = new Date(dataStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function eventoFinalizado(dataStr) {
  if (!dataStr) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataEvento = new Date(dataStr + "T00:00:00");
  return dataEvento < hoje;
}

export default function EventoDetalhePage() {
  const { eventoId } = useParams();
  const router = useRouter();

  const [evento, setEvento] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");

  useEffect(() => {
    async function buscarEvento() {
      setCarregando(true);
      setErro("");
      try {
        const res = await fetch(
          `${API_BASE}/api/coordenacao/calendario/eventos/${eventoId}`,
          { credentials: "include" }
        );

        if (!res.ok) {
          const corpoErro = await res.text();
          let mensagem = "Não foi possível carregar o evento.";
          try {
            const json = JSON.parse(corpoErro);
            if (json?.message) mensagem = json.message;
          } catch {
            // corpo não era JSON, mantém mensagem padrão
          }
          throw new Error(mensagem);
        }

        const data = await res.json();
        setEvento(data.evento);
      } catch (e) {
        setErro(e.message || "Erro ao carregar evento.");
      } finally {
        setCarregando(false);
      }
    }

    if (eventoId) buscarEvento();
  }, [eventoId]);

  async function handleExcluir() {
    setExcluindo(true);
    setErroExclusao("");
    try {
      const res = await fetch(
        `${API_BASE}/api/coordenacao/eventos/${eventoId}/`,
        { method: "DELETE", credentials: "include" }
      );

      if (!res.ok) {
        const corpoErro = await res.text();
        let mensagem = "Não foi possível apagar o evento.";
        try {
          const json = JSON.parse(corpoErro);
          if (json?.message) mensagem = json.message;
        } catch {
          // corpo não era JSON, mantém mensagem padrão
        }
        throw new Error(mensagem);
      }

      router.push("/coordenacao/calendario");
    } catch (e) {
      setErroExclusao(e.message || "Erro ao apagar evento.");
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  }

  if (carregando) {
    return (
      <div className={styles.container}>
        <p className={styles.estado}>Carregando evento…</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className={styles.container}>
        <p className={styles.estadoErro}>{erro}</p>
        <Link href="/coordenacao/calendario" className={styles.linkVoltar}>
          Voltar ao calendário
        </Link>
      </div>
    );
  }

  if (!evento) return null;

  const finalizado = eventoFinalizado(evento.data);
  const geral = !evento.turma && !evento.professor;

  return (
    <div className={styles.container}>
      <div className={styles.topo}>
        <Link href="/coordenacao/calendario" className={styles.linkVoltar}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar ao calendário
        </Link>
      </div>

      <div className={styles.painel}>
        <div className={styles.cabecalho}>
          <div className={styles.badges}>
            <span
              className={`${styles.badge} ${geral ? styles.badgeGeral : styles.badgeEspecifico
                }`}
            >
              {geral ? "Evento geral" : "Evento específico"}
            </span>
            <span
              className={`${styles.badge} ${finalizado ? styles.badgeFinalizado : styles.badgeAgendado
                }`}
            >
              {finalizado ? "Finalizado" : "Agendado"}
            </span>
          </div>

          <h1 className={styles.titulo}>{evento.titulo}</h1>
          <p className={styles.data}>{formatarData(evento.data)}</p>
        </div>

        <div className={styles.corpo}>
          <div className={styles.bloco}>
            <span className={styles.blocoLabel}>Descrição</span>
            <p className={styles.blocoTexto}>
              {evento.descricao || "Sem descrição."}
            </p>
          </div>

          {evento.turma && (
            <div className={styles.bloco}>
              <span className={styles.blocoLabel}>Turma</span>
              <p className={styles.blocoTexto}>
                {evento.turma?.nome || evento.turma}
              </p>
            </div>
          )}

          {evento.professor && (
            <div className={styles.bloco}>
              <span className={styles.blocoLabel}>Professor</span>
              <p className={styles.blocoTexto}>{evento.professor}</p>
            </div>
          )}

          {evento.coordenador && (
            <div className={styles.bloco}>
              <span className={styles.blocoLabel}>Criado por</span>
              <p className={styles.blocoTexto}>
                {evento.coordenador?.nome_completo || evento.coordenador}
              </p>
            </div>
          )}

          {evento.criado_por && (
            <div className={styles.bloco}>
              <span className={styles.blocoLabel}>Criado por</span>
              <p className={styles.blocoTexto}>{evento.criado_por}</p>
            </div>
          )}
        </div>

        <div className={styles.acoes}>
          <Link
            href={`/coordenacao/calendario/${eventoId}/editar`}
            className={styles.botaoEditar}
          >
            Editar evento
          </Link>

          {!confirmandoExclusao ? (
            <button
              type="button"
              className={styles.botaoApagar}
              onClick={() => setConfirmandoExclusao(true)}
            >
              Apagar evento
            </button>
          ) : (
            <div className={styles.confirmacaoInline}>
              <span>Confirmar exclusão?</span>
              <button
                type="button"
                className={styles.botaoConfirmarSim}
                onClick={handleExcluir}
                disabled={excluindo}
              >
                {excluindo ? "Apagando…" : "Sim"}
              </button>
              <button
                type="button"
                className={styles.botaoConfirmarNao}
                onClick={() => setConfirmandoExclusao(false)}
                disabled={excluindo}
              >
                Não
              </button>
            </div>
          )}
        </div>

        {erroExclusao && <p className={styles.estadoErro}>{erroExclusao}</p>}
      </div>
    </div>
  );
}