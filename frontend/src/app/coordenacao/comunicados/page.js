"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export default function ComunicadosCoordenacaoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [comunicados, setComunicados] = useState([]);
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

    async function carregarComunicados() {
      setCarregando(true);
      setErros([]);

      try {
        const res = await fetch(`${API_BASE}/api/coordenacao/comunicados`);
        if (!res.ok) throw new Error(`Falha ao buscar comunicados (status ${res.status})`);
        const data = await res.json();
        setComunicados(data.comunicados || []);
      } catch (error) {
        setErros([`Erro ao carregar comunicados: ${error.message}`]);
      } finally {
        setCarregando(false);
      }
    }

    carregarComunicados();
  }, [authenticated]);

  async function handleDeletar(comunicadoId) {
    setDeletandoId(comunicadoId);
    setErros([]);
    setMensagemSucesso(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/coordenacao/comunicados/${comunicadoId}/deletar`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`Falha ao remover (status ${res.status})`);

      const data = await res.json();
      setComunicados((prev) => prev.filter((c) => c.id !== comunicadoId));
      setMensagemSucesso(data.message);
    } catch (error) {
      setErros([`Erro ao remover comunicado: ${error.message}`]);
    } finally {
      setDeletandoId(null);
      setConfirmandoId(null);
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
            <h1 className={styles.title}>Comunicados</h1>
            <p className={styles.subtitle}>Avisos enviados para a escola.</p>
          </div>
          <Link href="/coordenacao/comunicados/novo" className={styles.novoBotao}>
            + Novo comunicado
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

        {carregando ? (
          <p className={styles.subtitle}>Carregando comunicados...</p>
        ) : comunicados.length === 0 ? (
          <p className={styles.vazio}>Nenhum comunicado cadastrado.</p>
        ) : (
          <ul className={styles.lista}>
            {comunicados.map((comunicado) => {
              const confirmando = confirmandoId === comunicado.id;
              const [ano, mes, dia] = comunicado.data.split("-");

              return (
                <li key={comunicado.id} className={styles.card}>
                  <Link
                    href={`/coordenacao/comunicados/${comunicado.id}`}
                    className={styles.cardLink}
                  >
                    <div className={styles.cardData}>
                      {dia}
                      <span>{MESES[Number(mes) - 1]}</span>
                    </div>

                    <div className={styles.cardInfo}>
                      <p className={styles.cardTitulo}>{comunicado.titulo}</p>

                      <div className={styles.cardBadges}>
                        {comunicado.nome_turma ? (
                          <span className={styles.badgeEspecifico}>{comunicado.nome_turma}</span>
                        ) : (
                          <span className={styles.badgeGeral}>Geral</span>
                        )}
                        {comunicado.criado_por && (
                          <span className={styles.badgeOrigem}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 21l18 0" />
                              <path d="M5 21v-14l8 -4v18" />
                              <path d="M19 21v-10l-6 -4" />
                            </svg>
                            {comunicado.criado_por}
                          </span>
                        )}
                      </div>

                      <p className={styles.cardMensagem}>{comunicado.mensagem}</p>
                    </div>
                  </Link>

                  {!confirmando ? (
                    <div className={styles.cardAcoes}>
                      <Link
                        href={`/coordenacao/comunicados/${comunicado.id}/editar`}
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
                        onClick={() => setConfirmandoId(comunicado.id)}
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
                        onClick={() => handleDeletar(comunicado.id)}
                        disabled={deletandoId === comunicado.id}
                      >
                        {deletandoId === comunicado.id ? "..." : "Sim"}
                      </button>
                      <button
                        type="button"
                        className={styles.cancelarBotao}
                        onClick={() => setConfirmandoId(null)}
                        disabled={deletandoId === comunicado.id}
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
    </div>
  );
}