"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "../../../assets/logo.png";
import styles from "../page.module.css";

const API_BASE = "/backend-api";

export default function ResponsavelRegistrarPage() {
  const router = useRouter();
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [buscaAluno, setBuscaAluno] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [alunosEncontrados, setAlunosEncontrados] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null); // { id, nome_completo, turma }
  const [buscando, setBuscando] = useState(false);
  const [parentesco, setParentesco] = useState("");

  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // busca com debounce enquanto digita
  useEffect(() => {
    if (alunoSelecionado) return; // não busca de novo se já escolheu
    if (buscaAluno.trim().length < 3) {
      setAlunosEncontrados([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(`${API_BASE}/api/responsavel/alunos/buscar?q=${encodeURIComponent(buscaAluno)}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setAlunosEncontrados(data.alunos || []);
        }
      } catch {
        // falha silenciosa na busca
      } finally {
        setBuscando(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [buscaAluno, alunoSelecionado]);

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

  function selecionarAluno(aluno) {
    setAlunoSelecionado(aluno);
    setBuscaAluno(`${aluno.nome_completo} — ${aluno.turma || "sem turma"}`);
    setDropdownAberto(false);
  }

  function limparAlunoSelecionado() {
    setAlunoSelecionado(null);
    setBuscaAluno("");
    setParentesco("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (!nomeCompleto.trim() || !senha.trim()) {
      setErro("Nome completo e senha são obrigatórios.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (alunoSelecionado && !parentesco.trim()) {
      setErro("Selecione o parentesco com o aluno.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/responsavel/registrar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_completo: nomeCompleto.trim(),
          senha: senha.trim(),
          aluno_id: alunoSelecionado?.id || null,
          parentesco: parentesco.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Não foi possível criar a conta.");
      }
      setSucesso(true);
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setEnviando(false);
    }
  }

  if (sucesso) {
    return (
      <div className={styles.centerPage}>
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.masthead}>
              <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
              <p className={styles.eyebrow}>SIAA · Acesso do responsável</p>
              <h2 className={styles.title}>Conta criada!</h2>
            </div>
            <p className={styles.hint} style={{ textAlign: "center" }}>
              {alunoSelecionado
                ? "Sua conta foi criada e a solicitação de vínculo foi enviada. O aluno precisa aprová-la."
                : "Sua conta foi criada com sucesso."}{" "}
              Faça login para continuar.
            </p>
            <Link
              href="/responsavel/login"
              className={styles.submitButton}
              style={{ textAlign: "center", textDecoration: "none", display: "block" }}
            >
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.centerPage}>
      <div className={styles.card}>
        <div className={styles.cardBody}>
          <div className={styles.masthead}>
            <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
            <p className={styles.eyebrow}>SIAA · Acesso do responsável</p>
            <h2 className={styles.title}>Criar conta</h2>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label}>
                Nome completo <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Senha <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={mostrarSenha ? "text" : "password"}
                  className={styles.input}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 5c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 8.18m-6.72-1.07a3 3 0 1 1-4.24-4.24 3 3 0 0 1 4.24 4.24Z" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Confirmar senha <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={mostrarConfirmarSenha ? "text" : "password"}
                  className={styles.input}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                  aria-label={mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarConfirmarSenha ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 5c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 8.18m-6.72-1.07a3 3 0 1 1-4.24-4.24 3 3 0 0 1 4.24 4.24Z" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className={styles.field} ref={wrapperRef}>
              <label className={styles.label}>Vincular a um aluno (opcional)</label>

              <div className={styles.buscaWrapper}>
                <svg className={styles.buscaIcone} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="10" r="7" />
                  <line x1="21" y1="21" x2="15" y2="15" />
                </svg>
                <input
                  type="text"
                  value={buscaAluno}
                  onChange={(e) => {
                    setBuscaAluno(e.target.value);
                    setAlunoSelecionado(null);
                    setDropdownAberto(true);
                  }}
                  onFocus={() => setDropdownAberto(true)}
                  placeholder="Digite o nome completo do aluno..."
                  className={styles.buscaInput}
                  autoComplete="off"
                />
                {alunoSelecionado && (
                  <button
                    type="button"
                    onClick={limparAlunoSelecionado}
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

              {dropdownAberto && !alunoSelecionado && buscaAluno.trim().length >= 3 && (
                <div className={styles.dropdown}>
                  {buscando && <div className={styles.dropdownVazio}>Buscando...</div>}
                  {!buscando && alunosEncontrados.length === 0 && (
                    <div className={styles.dropdownVazio}>Nenhum aluno encontrado.</div>
                  )}
                  {!buscando &&
                    alunosEncontrados.map((a) => (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => selecionarAluno(a)}
                        className={styles.dropdownItem}
                      >
                        {a.nome_completo}
                      </button>
                    ))}
                </div>
              )}

              <span className={styles.dica}>
                Se preferir, deixe em branco e vincule depois pelo painel.
              </span>
            </div>

            {alunoSelecionado && (
              <div className={styles.field}>
                <label className={styles.label}>
                  Parentesco com {alunoSelecionado.nome_completo.split(" ")[0]}{" "}
                  <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.input}
                  value={parentesco}
                  onChange={(e) => setParentesco(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="Mãe">Mãe</option>
                  <option value="Pai">Pai</option>
                  <option value="Avó">Avó</option>
                  <option value="Avô">Avô</option>
                  <option value="Tia">Tia</option>
                  <option value="Tio">Tio</option>
                  <option value="Irmã(o)">Irmã(o)</option>
                  <option value="Responsável legal">Responsável legal</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            )}

            {erro && <div className={styles.erro}>{erro}</div>}

            <button type="submit" disabled={enviando} className={styles.submitButton}>
              {enviando ? "Criando..." : "Criar conta"}
            </button>
          </form>

          <p className={styles.hint} style={{ textAlign: "center", marginTop: "0.5rem" }}>
            Já tem conta?{" "}
            <Link href="/responsavel/login" className={styles.linkInline}>
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}