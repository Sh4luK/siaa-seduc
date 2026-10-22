"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import MarkdownContent from "@/app/components/MarkdownContent";
import logo from "../../../../assets/logo.png";
import layoutStyles from "../../page.module.css";
import styles from "./page.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatarDataHora(dataISO) {
  return new Date(dataISO).toLocaleString("pt-BR");
}

export default function EnviosAtividadePage() {
  const { atividadeId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [atividade, setAtividade] = useState(null);
  const [envios, setEnvios] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarEnvios() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`, { credentials: "include" });
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/professor/login");
          return;
        }

        const res = await fetch(
          `${API_BASE}/api/teacher/atividades/${atividadeId}/envios`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Falha ao buscar envios (status ${res.status})`);
        setAtividade(data.atividade);
        setEnvios(data.envios || []);
      } catch (error) {
        setErro(`Erro ao carregar envios: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    carregarEnvios();
  }, [atividadeId, router]);

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}>
            <span className={layoutStyles.loadingBarFill} />
          </div>
          <p className={layoutStyles.loadingText}>Carregando envios…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.content}>
        <main className={layoutStyles.main}>
          <div className={styles.wrapper}>
            <div className={styles.headerRow}>
              <div>
                <h1 className={styles.title}>{atividade?.titulo || "Envios da atividade"}</h1>
                {atividade && (
                  <p className={styles.subtitle}>
                    {atividade.nome_turma} · {atividade.disciplina}
                    {atividade.data_entrega && ` · Prazo: ${atividade.data_entrega}`}
                  </p>
                )}
              </div>
              <button
                type="button"
                className={styles.voltarBotao}
                onClick={() => router.push("/professor/atividades")}
              >
                Voltar
              </button>
            </div>

            {erro ? (
              <p className={styles.erro}>{erro}</p>
            ) : envios.length === 0 ? (
              <p className={styles.vazio}>Nenhum aluno enviou esta atividade ainda.</p>
            ) : (
              <>
                <p className={styles.resumo}>
                  {envios.length} {envios.length === 1 ? "envio recebido" : "envios recebidos"}
                </p>
                <ul className={styles.lista}>
                  {envios.map((envio) => (
                    <li key={envio.id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <h2 className={styles.aluno}>{envio.aluno}</h2>
                        {envio.atrasado && <span className={styles.atrasado}>Enviado com atraso</span>}
                      </div>
                      <p className={styles.dataEnvio}>Enviado em {formatarDataHora(envio.enviado_em)}</p>
                      {envio.comentario && <div className={styles.comentario}>
                        <MarkdownContent content={envio.comentario} />
                      </div>}
                      <a
                        className={styles.arquivoLink}
                        href={`${API_BASE}${envio.arquivo_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        Baixar {envio.arquivo_nome}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
