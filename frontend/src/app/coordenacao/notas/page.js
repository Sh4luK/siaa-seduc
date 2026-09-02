"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function NotasCoordenacaoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [turmasAgrupadas, setTurmasAgrupadas] = useState([]);
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

        const res = await fetch(`${API_BASE}/api/coordenacao/notas/opcoes`);
        if (!res.ok) throw new Error(`Falha ao buscar turmas (status ${res.status})`);
        const data = await res.json();
        const vinculos = data.vinculos || [];

        const grupos = {};
        for (const v of vinculos) {
          const chave = v.turma;
          if (!grupos[chave]) {
            grupos[chave] = { nomeTurma: chave, opcoes: [] };
          }
          grupos[chave].opcoes.push(v);
        }

        setTurmasAgrupadas(Object.values(grupos));
      } catch (error) {
        setErros([`Erro ao carregar turmas: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <p className={styles.subtituloLoading}>Verificando credenciais…</p>
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

        <h1 className={styles.title}>Notas</h1>
        <p className={styles.subtitle}>
          Selecione a turma e a disciplina para visualizar as notas lançadas.
        </p>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        {turmasAgrupadas.length === 0 ? (
          <p className={styles.alunosEmpty}>Nenhuma turma encontrada.</p>
        ) : (
          <ul className={styles.turmasList}>
            {turmasAgrupadas.map((grupo) => (
              <li key={grupo.nomeTurma} className={styles.turmaCard}>
                <div className={styles.turmaCardHeader}>
                  <span className={styles.turmaIcon}>
                    <i className="ti ti-users" aria-hidden="true" />
                  </span>
                  <span className={styles.turmaNome} title={grupo.nomeTurma}>
                    {grupo.nomeTurma}
                  </span>
                </div>

                <div className={styles.disciplinasChips}>
                  {grupo.opcoes.map((opcao) => (
                    <Link
                      key={opcao.id}
                      href={`/coordenacao/notas/${opcao.id}`}
                      className={styles.disciplinaChip}
                    >
                      {opcao.disciplina_lecionada} — {opcao.professor_nome}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}