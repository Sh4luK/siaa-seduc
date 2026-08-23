"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "http://127.0.0.1:8000";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatarData(dataStr) {
  if (!dataStr) return "";
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia} de ${MESES[Number(mes) - 1]} de ${ano}`;
}

export default function ComunicadoDetalhePage() {
  const { comunicadoId } = useParams();
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comunicado, setComunicado] = useState(null);
  const [erro, setErro] = useState("");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");

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

        const res = await fetch(`${API_BASE}/api/coordenacao/comunicados/${comunicadoId}`);
        if (!res.ok) {
          const corpoErro = await res.text();
          let mensagem = "Não foi possível carregar o comunicado.";
          try {
            const json = JSON.parse(corpoErro);
            if (json?.message) mensagem = json.message;
          } catch {}
          throw new Error(mensagem);
        }
        const data = await res.json();
        setComunicado(data.comunicado);
      } catch (error) {
        setErro(error.message || "Erro ao carregar comunicado.");
      } finally {
        setLoading(false);
      }
    }

    if (comunicadoId) init();
  }, [router, comunicadoId]);

  async function handleExcluir() {
    setExcluindo(true);
    setErroExclusao("");
    try {
      const res = await fetch(
        `${API_BASE}/api/coordenacao/comunicados/${comunicadoId}/deletar`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const corpoErro = await res.text();
        let mensagem = "Não foi possível apagar o comunicado.";
        try {
          const json = JSON.parse(corpoErro);
          if (json?.message) mensagem = json.message;
        } catch {}
        throw new Error(mensagem);
      }

      router.push("/coordenacao/comunicados");
    } catch (error) {
      setErroExclusao(error.message || "Erro ao apagar comunicado.");
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <div className={styles.headerLoading}>
            <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
            <p className={styles.subtituloLoading}>Verificando credenciais…</p>
          </div>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  if (erro) {
    return (
      <div className={styles.page}>
        <div className={styles.wrapper}>
          <p className={styles.estadoErro}>{erro}</p>
          <Link href="/coordenacao/comunicados" className={styles.voltarLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6l6 6" />
            </svg>
            Comunicados
          </Link>
        </div>
      </div>
    );
  }

  if (!comunicado) return null;

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <Link href="/coordenacao/comunicados" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Comunicados
        </Link>

        <div className={styles.painel}>
          <div className={styles.cabecalho}>
            <div className={styles.badges}>
              {comunicado.nome_turma ? (
                <span className={styles.badgeEspecifico}>{comunicado.nome_turma}</span>
              ) : (
                <span className={styles.badgeGeral}>Geral</span>
              )}
            </div>

            <h1 className={styles.titulo}>{comunicado.titulo}</h1>
            <p className={styles.data}>{formatarData(comunicado.data)}</p>
          </div>

          <div className={styles.corpo}>
            <div className={styles.bloco}>
              <span className={styles.blocoLabel}>Mensagem</span>
              <p className={styles.blocoTexto}>{comunicado.mensagem}</p>
            </div>

            {comunicado.criado_por && (
              <div className={styles.bloco}>
                <span className={styles.blocoLabel}>Enviado por</span>
                <p className={styles.blocoTexto}>{comunicado.criado_por}</p>
              </div>
            )}
          </div>

          <div className={styles.acoes}>
            <Link
              href={`/coordenacao/comunicados/${comunicadoId}/editar`}
              className={styles.botaoEditar}
            >
              Editar comunicado
            </Link>

            {!confirmandoExclusao ? (
              <button
                type="button"
                className={styles.botaoApagar}
                onClick={() => setConfirmandoExclusao(true)}
              >
                Apagar comunicado
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
    </div>
  );
}