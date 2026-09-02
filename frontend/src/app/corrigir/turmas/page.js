"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function CorrigirTurmasPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [turmas, setTurmas] = useState([]);
  const [editandoTurma, setEditandoTurma] = useState(null);
  const [novoNome, setNovoNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState([]);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const router = useRouter();

  async function carregar() {
    const res = await fetch(`${API_BASE}/api/corrigir/turmas`);
    if (!res.ok) throw new Error(`Falha ao buscar turmas (status ${res.status})`);
    const data = await res.json();
    setTurmas(data.turmas || []);
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
        await carregar();
      } catch (error) {
        setErros([`Erro ao carregar: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  async function handleRenomear(turmaAntiga) {
    setSalvando(true);
    setErros([]);
    setMensagemSucesso(null);
    try {
      const res = await fetch(`${API_BASE}/api/corrigir/turmas/renomear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turma_antiga: turmaAntiga, turma_nova: novoNome.trim() }),
      });
      const corpo = await res.text();
      if (!res.ok) {
        let msg = "Falha ao renomear.";
        try { msg = JSON.parse(corpo).message || msg; } catch {}
        throw new Error(msg);
      }
      const data = JSON.parse(corpo);
      setMensagemSucesso(data.message);
      setEditandoTurma(null);
      await carregar();
    } catch (error) {
      setErros([error.message]);
    } finally {
      setSalvando(false);
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

        <h1 className={styles.title}>Turmas</h1>
        <p className={styles.subtitle}>
          Turmas marcadas com <span className={styles.badgeAlerta}>divergente</span> existem só do lado de
          professores ou só do lado de alunos — provável erro de digitação no nome.
        </p>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>{erros.map((e, i) => <li key={i}>{e}</li>)}</ul>
        )}
        {mensagemSucesso && <p className={styles.mensagemSucesso}>{mensagemSucesso}</p>}

        <ul className={styles.lista}>
          {turmas.map((t) => {
            const divergente = !(t.existe_em_atravessa_por && t.existe_em_estudante);
            const editando = editandoTurma === t.nome_turma;

            return (
              <li
                key={t.nome_turma}
                className={`${styles.item} ${divergente ? styles.itemDivergente : ""}`}
              >
                <div className={styles.itemInfo}>
                  <div className={styles.itemTopo}>
                    <p className={styles.itemNome}>{t.nome_turma}</p>
                    {divergente && <span className={styles.badgeAlerta}>divergente</span>}
                  </div>
                  <p className={styles.itemMeta}>
                    {t.total_registros} vínculo(s) de professor · {t.total_alunos} aluno(s)
                    {!t.existe_em_atravessa_por && " · sem professores vinculados"}
                    {!t.existe_em_estudante && " · sem alunos matriculados"}
                  </p>
                </div>

                {editando ? (
                  <div className={styles.itemAcoes}>
                    <input
                      type="text"
                      className={styles.input}
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className={styles.botaoSalvar}
                      onClick={() => handleRenomear(t.nome_turma)}
                      disabled={salvando}
                    >
                      {salvando ? "..." : "Salvar"}
                    </button>
                    <button type="button" className={styles.botaoCancelar} onClick={() => setEditandoTurma(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.botaoEditar}
                    onClick={() => {
                      setEditandoTurma(t.nome_turma);
                      setNovoNome(t.nome_turma);
                    }}
                  >
                    Renomear
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}