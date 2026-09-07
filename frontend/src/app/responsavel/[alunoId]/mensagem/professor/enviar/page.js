"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import layoutStyles from "../../../page.module.css";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function EnviarMensagemProfessorPage() {
  const router = useRouter();
  const params = useParams();
  const alunoId = params.alunoId;

  const [loading, setLoading] = useState(true);
  const [professores, setProfessores] = useState([]);

  const [busca, setBusca] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [professorSelecionado, setProfessorSelecionado] = useState(null); // { id, nome_completo }

  const [conteudo, setConteudo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  const wrapperRef = useRef(null);

  useEffect(() => {
    async function init() {
      const authRes = await fetch(`${API_BASE}/api/responsavel/auth`);
      const authData = await authRes.json();
      if (!authData.return) {
        router.push("/responsavel/login");
        return;
      }
      const res = await fetch(`${API_BASE}/api/responsavel/alunos/${alunoId}/mensagem/professor/opcoes`);
      if (res.ok) {
        const data = await res.json();
        setProfessores(data.professores || []);
      }
      setLoading(false);
    }
    init();
  }, [router, alunoId]);

  // fecha o dropdown ao clicar fora
  useEffect(() => {
    function aoClicarFora(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const professoresFiltrados = professores.filter((p) => {
    if (!busca.trim()) return true;
    return normalizar(p.nome_completo).includes(normalizar(busca));
  });

  function selecionarProfessor(professor) {
    setProfessorSelecionado(professor);
    setBusca(professor.nome_completo);
    setDropdownAberto(false);
  }

  function limparSelecao() {
    setProfessorSelecionado(null);
    setBusca("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (!professorSelecionado) {
      setErro("Selecione um professor.");
      return;
    }
    if (!conteudo.trim()) {
      setErro("Escreva uma mensagem.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/responsavel/alunos/${alunoId}/mensagem/professor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professor_id: professorSelecionado.id, conteudo: conteudo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Não foi possível enviar a mensagem.");
      router.push(`/responsavel/${alunoId}/mensagem/professor/${data.conversa_id}`);
    } catch (e2) {
      setErro(e2.message);
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <div className={layoutStyles.pageLoading}>
        <div className={layoutStyles.cardLoading}>
          <p className={layoutStyles.subtituloLoading}>Carregando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.topBar}>
        Governo do Estado do Piauí — Secretaria de Estado da Educação
      </div>
      <div className={layoutStyles.wrapper}>
        <Link href={`/responsavel/${alunoId}/mensagem/professor`} className={layoutStyles.voltarLink}>
          ← Conversas
        </Link>

        <h1 className={layoutStyles.title}>Nova mensagem</h1>

        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.campo} ref={wrapperRef}>
            <span className={styles.label}>Professor</span>

            <div className={styles.buscaWrapper}>
              <svg className={styles.buscaIcone} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="7" />
                <line x1="21" y1="21" x2="15" y2="15" />
              </svg>
              <input
                type="text"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setProfessorSelecionado(null);
                  setDropdownAberto(true);
                }}
                onFocus={() => setDropdownAberto(true)}
                placeholder="Pesquise pelo nome do professor..."
                className={styles.buscaInput}
                autoComplete="off"
              />
              {professorSelecionado && (
                <button
                  type="button"
                  onClick={limparSelecao}
                  className={styles.limparBtn}
                  aria-label="Limpar seleção"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {dropdownAberto && (
              <div className={styles.dropdown}>
                {professoresFiltrados.length === 0 && (
                  <div className={styles.dropdownVazio}>Nenhum professor encontrado.</div>
                )}
                {professoresFiltrados.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => selecionarProfessor(p)}
                    className={styles.dropdownItem}
                  >
                    {p.nome_completo}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* select nativo mantido como alternativa à busca */}
          <label className={styles.campo}>
            <span className={styles.label}>Ou selecione da lista</span>
            <select
              value={professorSelecionado?.id || ""}
              onChange={(e) => {
                const p = professores.find((prof) => String(prof.id) === e.target.value);
                if (p) selecionarProfessor(p);
              }}
              className={styles.select}
            >
              <option value="">Selecione um professor</option>
              {professores.map((p) => (
                <option key={p.id} value={p.id}>{p.nome_completo}</option>
              ))}
            </select>
          </label>

          <label className={styles.campo}>
            <span className={styles.label}>Mensagem</span>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={6}
              placeholder="Escreva a mensagem para o professor..."
              className={styles.textarea}
            />
          </label>

          {erro && <div className={styles.erro}>{erro}</div>}

          <button type="submit" disabled={enviando} className={styles.enviarBtn}>
            {enviando ? "Enviando..." : "Enviar mensagem"}
          </button>
        </form>
      </div>
    </div>
  );
}