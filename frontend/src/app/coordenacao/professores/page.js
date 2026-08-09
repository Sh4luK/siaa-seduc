"use client";


import logo from "../../../assets/logo.png";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

export default function ProfessoresCoordenacaoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [professores, setProfessores] = useState([]);
  const [busca, setBusca] = useState("");
  const [erros, setErros] = useState([]);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome_completo: "", senha: "" });
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

        const res = await fetch(`${API_BASE}/api/coordenacao/professores`);
        if (!res.ok) throw new Error(`Falha ao buscar professores (status ${res.status})`);
        const data = await res.json();
        setProfessores(data.professores || []);
      } catch (error) {
        setErros([`Erro ao carregar professores: ${error.message}`]);
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

  async function handleCadastrar(e) {
    e.preventDefault();
    setSaving(true);
    setErros([]);
    setMensagemSucesso(null);

    if (!form.nome_completo.trim() || !form.senha.trim()) {
      setErros(["Nome completo e senha são obrigatórios."]);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/professores/criar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_completo: form.nome_completo.trim(),
          senha: form.senha.trim(),
        }),
      });

      if (!res.ok) {
        const corpoErro = await res.text();
        let msg = `Falha ao cadastrar (status ${res.status})`;
        try {
          const json = JSON.parse(corpoErro);
          if (json.message) msg = json.message;
        } catch { }
        throw new Error(msg);
      }

      const data = await res.json();

      setProfessores((prev) =>
        [...prev, { ...data.professor, total_turmas: 0, total_disciplinas: 0, turmas: [] }].sort(
          (a, b) => a.nome_completo.localeCompare(b.nome_completo)
        )
      );
      setForm({ nome_completo: "", senha: "" });
      setMostrarForm(false);
      setMensagemSucesso("Professor cadastrado com sucesso.");
    } catch (error) {
      setErros([`Erro ao cadastrar professor: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  const professoresFiltrados = professores.filter((p) =>
    p.nome_completo.toUpperCase().includes(busca.trim().toUpperCase())
  );

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <div className={styles.headerLoading}>
            <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
            <p className={styles.subtituloLoading}>Verificando sessão…</p>
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
            <h1 className={styles.title}>Professores</h1>
            <p className={styles.subtitle}>
              {professores.length} professor(es) cadastrado(s).
            </p>
          </div>
          <Link href="/coordenacao/professores/novo" className={styles.novoBotao}>
            + Novo professor
          </Link>
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
            placeholder="Buscar professor pelo nome..."
            className={styles.buscaInput}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {carregando ? (
          <p className={styles.subtitle}>Carregando professores...</p>
        ) : professoresFiltrados.length === 0 ? (
          <p className={styles.vazio}>
            {busca ? "Nenhum professor encontrado para essa busca." : "Nenhum professor cadastrado ainda."}
          </p>
        ) : (
          <ul className={styles.professoresList}>
            {professoresFiltrados.map((professor) => {
              const iniciais = professor.nome_completo
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              return (
                <li key={professor.id} className={styles.professorCard}>
                  <div className={styles.professorHeader}>
                    <span className={styles.professorAvatar}>{iniciais}</span>
                    <div className={styles.professorInfo}>
                      <p className={styles.professorNome}>{professor.nome_completo}</p>
                      <p className={styles.professorMeta}>
                        {professor.total_turmas} turma(s) · {professor.total_disciplinas} disciplina(s)
                      </p>
                    </div>
                  </div>

                  {professor.turmas.length === 0 ? (
                    <p className={styles.semTurmas}>Nenhuma turma atribuída.</p>
                  ) : (
                    <div className={styles.turmasList}>
                      {professor.turmas.map((turma) => (
                        <div key={turma.nome_turma} className={styles.turmaBloco}>
                          <p className={styles.turmaNome}>
                            {turma.nome_turma}
                            {turma.etapa && <span className={styles.turmaEtapa}> · {turma.etapa}</span>}
                          </p>
                          <div className={styles.disciplinasChips}>
                            {turma.disciplinas.map((disc, i) => (
                              <span key={i} className={styles.chip}>{disc}</span>
                            ))}
                          </div>
                        </div>
                      ))}
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