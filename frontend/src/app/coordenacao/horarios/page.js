"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://humble-spoon-4j654556jr9vf5qp6-8000.app.github.dev";

export default function HorariosCoordenacaoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [turmas, setTurmas] = useState([]);
  const [busca, setBusca] = useState("");
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

        const res = await fetch(`${API_BASE}/api/coordenacao/turmas`);
        if (!res.ok) throw new Error(`Falha ao buscar turmas (status ${res.status})`);
        const data = await res.json();
        setTurmas(data.turmas || []);
      } catch (error) {
        setErros([`Erro ao carregar turmas: ${error.message}`]);
      } finally {
        setLoading(false);
        setCarregando(false);
      }
    }

    init();
  }, [router]);

  const turmasFiltradas = turmas.filter((t) =>
    t.nome_turma.toLowerCase().includes(busca.toLowerCase())
  );

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
            <h1 className={styles.title}>Horários</h1>
            <p className={styles.subtitle}>Selecione uma turma para ver a grade semanal.</p>
          </div>
        </div>

        <input
          type="text"
          className={styles.busca}
          placeholder="Buscar turma..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        {carregando ? (
          <p className={styles.subtitle}>Carregando turmas...</p>
        ) : turmasFiltradas.length === 0 ? (
          <p className={styles.vazio}>Nenhuma turma encontrada.</p>
        ) : (
          <ul className={styles.lista}>
            {turmasFiltradas.map((t) => (
              <li key={t.nome_turma}>
                <Link
                  href={`/coordenacao/horarios/${encodeURIComponent(t.nome_turma)}`}
                  className={styles.card}
                >
                  <div className={styles.cardInfo}>
                    <p className={styles.cardTitulo}>{t.nome_turma}</p>
                    <p className={styles.cardMeta}>
                      {t.etapa} · {t.escola} · {t.total_alunos} aluno{t.total_alunos !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6l-6 6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}