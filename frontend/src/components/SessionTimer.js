"use client";

import { useEffect, useState } from "react";
import styles from "./SessionTimer.module.css";

const API_BASE = "/backend-api";

function formatarTempo(segundos) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segundosRestantes = segundos % 60;

  return [horas, minutos, segundosRestantes]
    .map((parte) => String(parte).padStart(2, "0"))
    .join(":");
}

export default function SessionTimer({ tipo, visivel, onExpirou }) {
  const [contagem, setContagem] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let intervalo;
    let redirecionado = false;

    const expirarSessao = () => {
      if (redirecionado) return;
      redirecionado = true;
      onExpirou();
    };

    fetch(`${API_BASE}/api/session/status?tipo=${encodeURIComponent(tipo)}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Não foi possível consultar a sessão.");
        return response.json();
      })
      .then((data) => {
        // Conta a partir dos segundos restantes informados pelo servidor, para não
        // depender do relógio do computador (relógio adiantado expirava cedo demais
        // e deixava o painel em loop com a tela de login).
        const expiraEm = Number.isFinite(data.expires_in)
          ? Date.now() + data.expires_in * 1000
          : Date.parse(data.expires_at);
        if (data.return !== true || !Number.isFinite(expiraEm)) {
          if (data.return === false) {
            expirarSessao();
          } else {
            setContagem({ erro: true });
          }
          return;
        }

        const atualizarTempo = () => {
          const segundos = Math.max(0, Math.ceil((expiraEm - Date.now()) / 1000));
          setContagem({
            segundos,
          });
          if (segundos === 0) expirarSessao();
        };
        atualizarTempo();
        intervalo = window.setInterval(atualizarTempo, 1000);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setContagem({ erro: true });
        }
      });

    return () => {
      controller.abort();
      window.clearInterval(intervalo);
    };
  }, [tipo, onExpirou]);

  if (!visivel) return null;
  if (!contagem) return <strong className={styles.tempo}>Carregando...</strong>;

  const indisponivel = contagem.erro;
  const tempoRestante = contagem.segundos;
  const expirou = !indisponivel && tempoRestante === 0;

  return (
    <strong className={`${styles.tempo} ${expirou || indisponivel ? styles.expirado : ""}`}>
      {indisponivel ? "Indisponível" : expirou ? "Expirada" : formatarTempo(tempoRestante)}
    </strong>
  );
}
