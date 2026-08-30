"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://humble-spoon-4j654556jr9vf5qp6-8000.app.github.dev";

export default function CorrigirAlunosPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState([]);
  const [turmasDisponiveis, setTurmasDisponiveis] = useState([]);
  const [busca, setBusca] = useState("");
  const [selecoes, setSelecoes] = useState({}); // alunoId -> nova turma escolhida
  const [salvandoId, setSalvandoId] = useState(null);
  const [erros, setErros] = useState([]);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const router = useRouter();

  async function carregar(termoBusca) {
    const url = termoBusca
      ? `${API_BASE}/api/corrigir/alunos?busca=${encodeURIComponent(termoBusca)}`
      : `${API_BASE}/api/corrigir/alunos`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Falha ao buscar alunos (status ${res.status})`);
    const data = await res.json();
    setAlunos(data.alunos || []);
    setTurmasDisponiveis(data.turmas_disponiveis || []);
  }

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/coordenacao/login");
          return;
        }
        setAuthenticated(true);
        await carregar("");
      } catch (error) {
        setErros([`Erro ao carregar: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  useEffect(() => {
    if (!authenticated) return;
    const timeout = setTimeout(() => {
      carregar(busca).catch((error) => setErros([error.message]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [busca, authenticated]);

  async function handleMover(alunoId) {
    const novaTurma = selecoes[alunoId];
    if (!novaTurma) return;

    setSalvandoId(alunoId);
    setErros([]);
    setMensagemSucesso(null);

    try {
      const res = await fetch(`${API_BASE}/api/corrigir/alunos/${alunoId}/mover-turma`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turma: novaTurma }),
      });
      const corpo = await res.text();
      if (!res.ok) {
        let msg = "Falha ao mover aluno.";
        try { msg = JSON.parse(corpo).message || msg; } catch {}
        throw new Error(msg);
      }
      const data = JSON.parse(corpo);
      setMensagemSucesso(data.message);
      setAlunos((prev) => prev.map((a) => (a.id === alunoId ? { ...a, turma: novaTurma } : a)));
    } catch (error) {
      setErros([error.message]);
    } finally {
      setSalvandoId(null);
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
        <Link href="/corrigir" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Correção de dados
        </Link>

        <h1 className={styles.title}>Alunos</h1>
        <p className={styles.subtitle}>Corrija a turma de um aluno rapidamente, sem abrir a tela de edição completa.</p>

        <input
          type="text"
          className={styles.busca}
          placeholder="Buscar aluno pelo nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        {erros.length > 0 && (
          <ul className={styles.listaErros}>{erros.map((e, i) => <li key={i}>{e}</li>)}</ul>
        )}
        {mensagemSucesso && <p className={styles.mensagemSucesso}>{mensagemSucesso}</p>}

        {alunos.length === 0 ? (
          <p className={styles.vazio}>Nenhum aluno encontrado.</p>
        ) : (
          <ul className={styles.lista}>
            {alunos.map((a) => {
              const valorSelecionado = selecoes[a.id] ?? a.turma;
              const alterado = valorSelecionado !== a.turma;

              return (
                <li key={a.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemNome}>{a.nome_completo}</p>
                    <p className={styles.itemMeta}>{a.serie || "—"} · {a.escola || "—"}</p>
                  </div>

                  <div className={styles.itemAcoes}>
                    <select
                      className={styles.select}
                      value={valorSelecionado}
                      onChange={(e) =>
                        setSelecoes((prev) => ({ ...prev, [a.id]: e.target.value }))
                      }
                    >
                      {!turmasDisponiveis.includes(a.turma) && a.turma && (
                        <option value={a.turma}>{a.turma} (atual)</option>
                      )}
                      {turmasDisponiveis.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.botaoSalvar}
                      onClick={() => handleMover(a.id)}
                      disabled={!alterado || salvandoId === a.id}
                    >
                      {salvandoId === a.id ? "..." : "Mover"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}