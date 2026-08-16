"use client";

import logo from "../../../assets/logo.png"
import Image from "next/image"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import layoutStyles from "../page.module.css"
import styles from "./page.module.css"

const API_BASE = "http://127.0.0.1:8000";

function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function ComunicadosPage() {
  const [authenticated, setAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("")
  const [professorId, setProfessorId] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [turmasAgrupadas, setTurmasAgrupadas] = useState([])
  const [comunicados, setComunicados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erros, setErros] = useState([])
  const [mensagemSucesso, setMensagemSucesso] = useState(null)
  const [deletandoId, setDeletandoId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)

  const [form, setForm] = useState({ titulo: "", mensagem: "", turma_id: "" });

  const router = useRouter()

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/teacher/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          setAuthenticated(false);
          router.push("/professor/login");
          return;
        }
        setAuthenticated(true);
        setNomeCompleto(authData.teacher.nome_completo);
        setProfessorId(authData.teacher.id);

        const turmasRes = await fetch(
          `${API_BASE}/api/teacher/search/turmas?nome_completo=${encodeURIComponent(authData.teacher.nome_completo)}`
        );
        if (turmasRes.ok) {
          const turmasData = await turmasRes.json();
          const turmas = turmasData.turmas || [];
          const grupos = {};
          for (const turma of turmas) {
            const chave = turma.turma;
            if (!grupos[chave]) grupos[chave] = { nomeTurma: chave, opcoes: [] };
            grupos[chave].opcoes.push(turma);
          }
          setTurmasAgrupadas(Object.values(grupos));
        }

        const comunicadosRes = await fetch(
          `${API_BASE}/api/teacher/comunicados?professor=${authData.teacher.id}`
        );
        if (!comunicadosRes.ok) throw new Error(`Falha ao buscar comunicados (status ${comunicadosRes.status})`);
        const comunicadosData = await comunicadosRes.json();
        setComunicados(comunicadosData.comunicados || []);
      } catch (error) {
        setErros([`Erro ao carregar dados: ${error.message}`]);
      } finally {
        setLoading(false);
        setCarregando(false);
      }
    }

    init();
  }, [router]);

  function handleFormChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleEnviar(e) {
    e.preventDefault();
    setSaving(true);
    setErros([]);
    setMensagemSucesso(null);

    if (!form.titulo.trim() || !form.mensagem.trim()) {
      setErros(["Título e mensagem são obrigatórios."]);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/teacher/comunicados/criar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professor: professorId,
          titulo: form.titulo.trim(),
          mensagem: form.mensagem.trim(),
          turma: form.turma_id || null,
        }),
      });

      if (!res.ok) {
        const corpoErro = await res.text();
        throw new Error(`Falha ao enviar (status ${res.status}) - ${corpoErro}`);
      }

      const data = await res.json();
      setComunicados((prev) => [data.comunicado, ...prev]);
      setForm({ titulo: "", mensagem: "", turma_id: "" });
      setMostrarForm(false);
      setMensagemSucesso("Comunicado enviado com sucesso.");
    } catch (error) {
      setErros([`Erro ao enviar comunicado: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletar(comunicadoId) {
    setDeletandoId(comunicadoId);
    try {
      const res = await fetch(
        `${API_BASE}/api/teacher/comunicados/${comunicadoId}/deletar`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`Falha ao remover (status ${res.status})`);

      setComunicados((prev) => prev.filter((c) => c.id !== comunicadoId));
    } catch (error) {
      setErros([`Erro ao remover comunicado: ${error.message}`]);
    } finally {
      setDeletandoId(null);
    }
  }

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}>
            <span className={layoutStyles.loadingBarFill} />
          </div>
          <p className={layoutStyles.loadingText}>Carregando comunicados…</p>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  const firstName = nomeCompleto.split(" ")[0];

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.shell}>
        <aside className={`${layoutStyles.sidebar} ${menuOpen ? layoutStyles.sidebarOpen : ""}`}>
          <div className={layoutStyles.sidebarHeader}>
            <Image src={logo} alt="Logo do SIAA" className={layoutStyles.sidebarLogo} priority />
            <span className={layoutStyles.sidebarBrand}>SIAA</span>
          </div>

          <nav className={layoutStyles.nav}>
            <Link href="/professor" className={layoutStyles.navLink}>
              <i className="ti ti-home" aria-hidden="true" />
              Início
            </Link>
            <Link href="/professor/turmas" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Minhas turmas
            </Link>
            <Link href="/professor/calendario" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Calendario Escolar
            </Link>
            <Link href="/professor/frequencia" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Frequencia
            </Link>
            <Link href="/professor/conteudos" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Conteudos
            </Link>
            <Link href="/professor/atividades" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Atividades
            </Link>
            <Link href="/professor/avaliacoes" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Avaliações
            </Link>
            <Link href="/professor/comunicados" className={layoutStyles.navLinkActive}>
              <i className="ti ti-message" aria-hidden="true" />
              Comunicados
            </Link>
            <Link href="/professor/notas" className={layoutStyles.navLink}>
              <i className="ti ti-edit" aria-hidden="true" />
              Lançar notas
            </Link>
            <Link href="/professor/frequencia" className={layoutStyles.navLink}>
              <i className="ti ti-clipboard-check" aria-hidden="true" />
              Frequência
            </Link>
            <Link href="/professor/horarios" className={layoutStyles.navLink}>
              <i className="ti ti-clock" aria-hidden="true" />
              Horários
            </Link>
          </nav>

          <div className={layoutStyles.sidebarFooter}>
            <div>
              <span className={layoutStyles.infoCardHeader}>
                <span className={layoutStyles.infoCardSeal}>{firstName.charAt(0)}</span>
                <span className={layoutStyles.studentName}>{nomeCompleto}</span>
              </span>
            </div>
          </div>
        </aside>

        {menuOpen && (
          <button
            className={layoutStyles.overlay}
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <div className={layoutStyles.content}>
          <header className={layoutStyles.topbar}>
            <button
              className={layoutStyles.menuButton}
              aria-label="Abrir menu"
              onClick={() => setMenuOpen(true)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            <span className={layoutStyles.topbarTitle}>Comunicados</span>
          </header>

          <main className={layoutStyles.main}>
            <div className={styles.headerRow}>
              <div>
                <h1 className={layoutStyles.greeting}>Comunicados</h1>
                <p className={layoutStyles.subtitle}>
                  Avisos enviados por você, {firstName}.
                </p>
              </div>
              <button className={styles.novoBotao} onClick={() => setMostrarForm((v) => !v)}>
                {mostrarForm ? "Cancelar" : "+ Novo comunicado"}
              </button>
            </div>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            {mensagemSucesso && <p className={styles.mensagemSucesso}>{mensagemSucesso}</p>}

            {mostrarForm && (
              <form className={styles.form} onSubmit={handleEnviar}>
                <div className={styles.campo}>
                  <label className={styles.label} htmlFor="titulo">
                    Título <span className={styles.obrigatorio}>*</span>
                  </label>
                  <input
                    id="titulo"
                    type="text"
                    className={styles.input}
                    placeholder="Ex: Suspensão de aula, Reunião de pais..."
                    value={form.titulo}
                    onChange={(e) => handleFormChange("titulo", e.target.value)}
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label className={styles.label} htmlFor="turma">
                    Turma <span className={styles.opcional}>(opcional)</span>
                  </label>
                  <select
                    id="turma"
                    className={styles.select}
                    value={form.turma_id}
                    onChange={(e) => handleFormChange("turma_id", e.target.value)}
                  >
                    <option value="">Comunicado geral (todas as turmas)</option>
                    {turmasAgrupadas.map((grupo) => (
                      <option key={grupo.nomeTurma} value={grupo.opcoes[0].id}>
                        {grupo.nomeTurma}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.campo}>
                  <label className={styles.label} htmlFor="mensagem">
                    Mensagem <span className={styles.obrigatorio}>*</span>
                  </label>
                  <textarea
                    id="mensagem"
                    className={styles.textarea}
                    placeholder="Escreva o comunicado..."
                    value={form.mensagem}
                    onChange={(e) => handleFormChange("mensagem", e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <button type="submit" className={styles.botaoEnviar} disabled={saving}>
                  {saving ? "Enviando..." : "Enviar comunicado"}
                </button>
              </form>
            )}

            {carregando ? (
              <p className={styles.subtitle}>Carregando comunicados...</p>
            ) : comunicados.length === 0 ? (
              <p className={styles.vazio}>Nenhum comunicado enviado ainda.</p>
            ) : (
              <ul className={styles.comunicadosList}>
                {comunicados.map((c) => (
                  <li key={c.id} className={styles.comunicadoCard}>
                    <div className={styles.comunicadoIcone}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 9h8" />
                        <path d="M8 13h6" />
                        <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3z" />
                      </svg>
                    </div>
                    <div className={styles.comunicadoInfo}>
                      <div className={styles.comunicadoTopo}>
                        <p className={styles.comunicadoTitulo}>{c.titulo}</p>
                        <span className={styles.comunicadoData}>{formatarData(c.data)}</span>
                      </div>
                      {c.nome_turma ? (
                        <span className={styles.comunicadoTurmaBadge}>{c.nome_turma}</span>
                      ) : (
                        <span className={styles.comunicadoGeralBadge}>Geral</span>
                      )}
                      <p className={styles.comunicadoMensagem}>{c.mensagem}</p>
                    </div>
                    <button
                      className={styles.comunicadoDeletar}
                      onClick={() => handleDeletar(c.id)}
                      disabled={deletandoId === c.id}
                      aria-label="Remover comunicado"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6l-12 12" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}