"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatarData(dataStr) {
  if (!dataStr) return "";
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia} de ${MESES[Number(mes) - 1]} de ${ano}`;
}

export default function AdvertenciaDetalhePage() {
  const { advertenciaId } = useParams();
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advertencia, setAdvertencia] = useState(null);
  const [erro, setErro] = useState("");

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

        const res = await fetch(`${API_BASE}/api/coordenacao/advertencias/${advertenciaId}`);
        if (!res.ok) {
          const corpoErro = await res.text();
          let mensagem = "Não foi possível carregar o registro.";
          try {
            const json = JSON.parse(corpoErro);
            if (json?.message) mensagem = json.message;
          } catch { }
          throw new Error(mensagem);
        }
        const data = await res.json();
        setAdvertencia(data.advertencia);
      } catch (error) {
        setErro(error.message || "Erro ao carregar registro.");
      } finally {
        setLoading(false);
      }
    }

    if (advertenciaId) init();
  }, [router, advertenciaId]);

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
          <Link href="/coordenacao/advertencias" className={styles.voltarLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6l6 6" />
            </svg>
            Advertências
          </Link>
        </div>
      </div>
    );
  }

  if (!advertencia) return null;

  const ehPenalidade = advertencia.tipo === "PENALIDADE";

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <Link href="/coordenacao/advertencias" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Advertências
        </Link>

        <div className={styles.painel}>
          <div className={styles.cabecalho}>
            <span className={`${styles.badge} ${ehPenalidade ? styles.badgePenalidade : styles.badgeAdvertencia}`}>
              {ehPenalidade ? "Penalidade" : "Advertência"}
            </span>

            <h1 className={styles.titulo}>{advertencia.titulo}</h1>
            <p className={styles.data}>{formatarData(advertencia.data)}</p>
          </div>

          <div className={styles.corpo}>
            <div className={styles.bloco}>
              <span className={styles.blocoLabel}>{ehPenalidade ? "Professor(a)" : "Aluno(a)"}</span>
              <p className={styles.blocoTexto}>
                {ehPenalidade ? advertencia.professor_nome : advertencia.aluno_nome}
              </p>
            </div>

            {!ehPenalidade && advertencia.aluno_turma && (
              <div className={styles.bloco}>
                <span className={styles.blocoLabel}>Turma</span>
                <p className={styles.blocoTexto}>{advertencia.aluno_turma}</p>
              </div>
            )}

            {!ehPenalidade && advertencia.is_suspensao && (
              <div className={styles.bloco}>
                <span className={styles.blocoLabel}>Período de suspensão</span>
                <p className={styles.blocoTexto}>
                  {advertencia.data_inicio_suspensao?.split("-").reverse().join("/")} até{" "}
                  {advertencia.data_termino_suspensao?.split("-").reverse().join("/")}
                </p>
              </div>
            )}

            <div className={styles.bloco}>
              <span className={styles.blocoLabel}>Descrição da ocorrência</span>
              <p className={styles.blocoTexto}>{advertencia.descricao}</p>
            </div>

            {advertencia.emitido_por && (
              <div className={styles.bloco}>
                <span className={styles.blocoLabel}>Emitido por</span>
                <p className={styles.blocoTexto}>{advertencia.emitido_por}</p>
              </div>
            )}
          </div>

          <div className={styles.acoes}>
            <a
              href={`${API_BASE}/api/coordenacao/advertencias/${advertenciaId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.botaoPdf}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
              </svg>
              Emitir PDF
            </a>

            <Link
              href={`/coordenacao/advertencias/${advertenciaId}/editar`}
              className={styles.botaoEditar}
            >
              Editar
            </Link>

            <Link
              href={`/coordenacao/advertencias/${advertenciaId}/deletar`}
              className={styles.botaoApagar}
            >
              Apagar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}