"use client";

import logo from "../../../../../assets/logo.png"
import Image from "next/image"
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import layoutStyles from "../../../page.module.css"
import styles from "./alunos.module.css"

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function AlunosDaTurmaPage() {
  const { turmaId } = useParams();
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [nomeTurma, setNomeTurma] = useState("")
  const [alunos, setAlunos] = useState([])
  const [busca, setBusca] = useState("")
  const [erros, setErros] = useState([])

  useEffect(() => {
    async function verifyAuthentication() {
      try {
        const response = await fetch(`${API_BASE}/api/teacher/auth`);
        const data = await response.json();
        if (data.return === true) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          router.push("/professor/login");
        }
      } catch (error) {
        setAuthenticated(false);
        router.push("/professor/login");
      }
    }

    async function getData() {
      try {
        const authResponse = await fetch(`${API_BASE}/api/teacher/auth`);
        if (!authResponse.ok) throw new Error();
        const data = await authResponse.json();
        setNomeCompleto(data["teacher"]["nome_completo"] || "Não encontrado.");
      } catch (error) {
        setNomeCompleto("Erro ao carregar.");
      }
    }

    async function getAlunosDaTurma() {
      try {
        const turmaRes = await fetch(`${API_BASE}/api/teacher/search/turma?turma=${turmaId}`)
        if (!turmaRes.ok) throw new Error(`Falha ao buscar turma (status ${turmaRes.status})`)
        const turmaData = await turmaRes.json()
        const nome = turmaData.turma?.turma
        if (!nome) throw new Error("Nome da turma não encontrado.")
        setNomeTurma(nome)

        const alunosRes = await fetch(
          `${API_BASE}/api/teacher/get/alunos?turma=${encodeURIComponent(nome)}`
        )
        if (!alunosRes.ok) throw new Error(`Falha ao buscar alunos (status ${alunosRes.status})`)
        const alunosData = await alunosRes.json()

        setAlunos(alunosData.alunos || [])
      } catch (error) {
        setErros([`Erro ao carregar alunos: ${error.message}`])
      } finally {
        setLoading(false)
      }
    }

    async function init() {
      await verifyAuthentication();
      await getData();
      await getAlunosDaTurma();
    }

    init();
  }, [turmaId]);

  const alunosFiltrados = alunos.filter((a) =>
    a.nome_completo.toUpperCase().includes(busca.trim().toUpperCase())
  );

  if (loading) {
    return (
      <div className={layoutStyles.page}>
        <div className={layoutStyles.loadingWrap}>
          <Image src={logo} alt="Logo do SIAA" className={layoutStyles.loadingLogo} priority />
          <div className={layoutStyles.loadingBar}>
            <span className={layoutStyles.loadingBarFill} />
          </div>
          <p className={layoutStyles.loadingText}>Carregando alunos…</p>
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
            <Link href="/professor/turmas" className={layoutStyles.navLinkActive}>
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
            <Link href="/professor/comunicados" className={layoutStyles.navLink}>
              <i className="ti ti-message" aria-hidden="true" />
              Comunicados
            </Link>
            <Link href="/professor/atividades" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Atividades
            </Link>
            <Link href="/professor/avaliacoes" className={layoutStyles.navLink}>
              <i className="ti ti-users" aria-hidden="true" />
              Avaliações
            </Link>
            <Link href="/professor/notas" className={layoutStyles.navLink}>
              <i className="ti ti-edit" aria-hidden="true" />
              Lançar notas
            </Link>
            <Link href="/professor/frequencia" className={layoutStyles.navLink}>
              <i className="ti ti-clipboard-check" aria-hidden="true" />
              Frequência
            </Link>
            <Link href="/professor/mensagem" className={layoutStyles.navLink}>
              <i className="ti ti-clock" aria-hidden="true" />
              Mensagens
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
          <button className={layoutStyles.overlay} aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />
        )}

        <div className={layoutStyles.content}>
          <header className={layoutStyles.topbar}>
            <button className={layoutStyles.menuButton} aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            <span className={layoutStyles.topbarTitle}>Alunos da turma</span>
          </header>

          <main className={layoutStyles.main}>
            <Link href={`/professor/turmas/${turmaId}`} className={styles.voltarLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6l6 6" />
              </svg>
              {nomeTurma || "Voltar para a turma"}
            </Link>

            <div className={styles.headerRow}>
              <div>
                <h1 className={layoutStyles.greeting}>Alunos da turma</h1>
                <p className={layoutStyles.subtitle}>{nomeTurma}</p>
              </div>
              <span className={styles.contador}>{alunos.length} aluno(s)</span>
            </div>

            {erros.length > 0 && (
              <ul className={styles.listaErros}>
                {erros.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}

            <div className={styles.buscaWrapper}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                <path d="M21 21l-6 -6" />
              </svg>
              <input
                type="text"
                placeholder="Buscar aluno pelo nome..."
                className={styles.buscaInput}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            {alunosFiltrados.length === 0 ? (
              <p className={styles.alunosEmpty}>
                {busca ? "Nenhum aluno encontrado para essa busca." : "Nenhum aluno matriculado nesta turma."}
              </p>
            ) : (
              <ul className={styles.alunosList}>
                {alunosFiltrados.map((aluno) => {
                  const iniciais = aluno.nome_completo
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <li key={aluno.id}>
                      <Link
                        href={`/professor/turmas/${turmaId}/alunos/${aluno.id}`}
                        className={styles.alunoItem}
                      >
                        <span className={styles.alunoAvatar}>{iniciais}</span>
                        <span className={styles.alunoInfo}>
                          <span className={styles.alunoNome}>{aluno.nome_completo}</span>
                          {aluno.posicao_ordem && (
                            <span className={styles.alunoPosicao}>Nº {aluno.posicao_ordem}</span>
                          )}
                        </span>
                        <span className={styles.alunoArrow} aria-hidden="true">→</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}