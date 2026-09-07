"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function DisciplinasCoordenacaoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disciplinas, setDisciplinas] = useState([]);
  const [busca, setBusca] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [novoNome, setNovoNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState([]);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const router = useRouter();

  async function carregar() {
    const res = await fetch(`${API_BASE}/api/coordenacao/disciplinas`);
    if (!res.ok) throw new Error(`Falha ao buscar disciplinas (status ${res.status})`);
    const data = await res.json();
    setDisciplinas(data.disciplinas || []);
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
        setErros([`Erro ao carregar disciplinas: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const disciplinasFiltradas = disciplinas.filter((d) =>
    d.nome_disciplina.toLowerCase().includes(busca.trim().toLowerCase())
  );

  async function handleSalvar(disciplinaId) {
    setSalvando(true);
    setErros([]);
    setMensagemSucesso(null);

    const nome = novoNome.trim();
    if (!nome) {
      setErros(["O nome não pode ficar vazio."]);
      setSalvando(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/coordenacao/disciplinas/${disciplinaId}/renomear`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome_disciplina: nome }),
        }
      );
      const corpo = await res.text();
      if (!res.ok) {
        let msg = "Falha ao renomear.";
        try { msg = JSON.parse(corpo).message || msg; } catch {}
        throw new Error(msg);
      }
      setMensagemSucesso("Disciplina renomeada com sucesso.");
      setEditandoId(null);
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
      <div className={styles.topBarInstitucional}>
        <span>Governo do Estado do Piauí</span>
        <span className={styles.topBarDivider} aria-hidden="true" />
        <span>Secretaria de Estado da Educação</span>
      </div>

      <div className={styles.wrapper}>
        <Link href="/coordenacao" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Coordenação
        </Link>

        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Disciplinas</h1>
            <p className={styles.subtitle}>
              {disciplinas.length} disciplina(s) cadastrada(s).
            </p>
          </div>
        </div>

        <input
          type="text"
          className={styles.busca}
          placeholder="Buscar disciplina..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
        {mensagemSucesso && <p className={styles.mensagemSucesso}>{mensagemSucesso}</p>}

        {disciplinasFiltradas.length === 0 ? (
          <p className={styles.vazio}>Nenhuma disciplina encontrada.</p>
        ) : (
          <ul className={styles.lista}>
            {disciplinasFiltradas.map((d) => {
              const editando = editandoId === d.id;

              return (
                <li key={d.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemNome}>{d.nome_disciplina}</p>
                    <p className={styles.itemMeta}>{d.total_vinculos} vínculo(s) de turma</p>
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
                        onClick={() => handleSalvar(d.id)}
                        disabled={salvando}
                      >
                        {salvando ? "..." : "Salvar"}
                      </button>
                      <button
                        type="button"
                        className={styles.botaoCancelar}
                        onClick={() => setEditandoId(null)}
                        disabled={salvando}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.botaoCorrigir}
                      onClick={() => {
                        setEditandoId(d.id);
                        setNovoNome(d.nome_disciplina);
                      }}
                    >
                      Corrigir
                    </button>
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