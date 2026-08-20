"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev";

export default function AdvertenciasCoordenacaoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [advertencias, setAdvertencias] = useState([]);
  const [filtro, setFiltro] = useState("TODOS"); // TODOS | ADVERTENCIA | PENALIDADE
  const [erros, setErros] = useState([]);
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

    async function carregar() {
      setCarregando(true);
      setErros([]);
      try {
        const url =
          filtro === "TODOS"
            ? `${API_BASE}/api/coordenacao/advertencias`
            : `${API_BASE}/api/coordenacao/advertencias?tipo=${filtro}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Falha ao buscar registros (status ${res.status})`);
        const data = await res.json();
        setAdvertencias(data.advertencias || []);
      } catch (error) {
        setErros([`Erro ao carregar registros: ${error.message}`]);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [authenticated, filtro]);

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
            <h1 className={styles.title}>Advertências e penalidades</h1>
            <p className={styles.subtitle}>Registros disciplinares de alunos e professores.</p>
          </div>
          <Link href="/coordenacao/advertencias/novo" className={styles.novoBotao}>
            + Emitir advertência
          </Link>
        </div>

        <div className={styles.filtros}>
          <button
            type="button"
            className={`${styles.filtroBotao} ${filtro === "TODOS" ? styles.filtroAtivo : ""}`}
            onClick={() => setFiltro("TODOS")}
          >
            Todos
          </button>
          <button
            type="button"
            className={`${styles.filtroBotao} ${filtro === "ADVERTENCIA" ? styles.filtroAtivo : ""}`}
            onClick={() => setFiltro("ADVERTENCIA")}
          >
            Advertências
          </button>
          <button
            type="button"
            className={`${styles.filtroBotao} ${filtro === "PENALIDADE" ? styles.filtroAtivo : ""}`}
            onClick={() => setFiltro("PENALIDADE")}
          >
            Penalidades
          </button>
        </div>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        {carregando ? (
          <p className={styles.subtitle}>Carregando registros...</p>
        ) : advertencias.length === 0 ? (
          <p className={styles.vazio}>Nenhum registro encontrado.</p>
        ) : (
          <ul className={styles.lista}>
            {advertencias.map((a) => (
              <li key={a.id} className={styles.card}>
                <Link href={`/coordenacao/advertencias/${a.id}`} className={styles.cardLink}>
                  <span
                    className={`${styles.tipoBadge} ${
                      a.tipo === "PENALIDADE" ? styles.tipoBadgePenalidade : styles.tipoBadgeAdvertencia
                    }`}
                  >
                    {a.tipo === "PENALIDADE" ? "Penalidade" : "Advertência"}
                  </span>

                  <div className={styles.cardInfo}>
                    <p className={styles.cardTitulo}>{a.titulo}</p>
                    <p className={styles.cardAlvo}>
                      {a.tipo === "PENALIDADE" ? a.professor_nome : `${a.aluno_nome} — ${a.aluno_turma}`}
                    </p>
                    <p className={styles.cardData}>{a.data.split("-").reverse().join("/")}</p>
                  </div>
                </Link>

                
                  href={`${API_BASE}/api/coordenacao/advertencias/${a.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.pdfBotao}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                  </svg>
                  PDF
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}