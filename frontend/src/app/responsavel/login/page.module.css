"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "../../../assets/logo.png";
import styles from "../page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function ResponsavelRegistrarPage() {
  const router = useRouter();
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

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

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/responsavel/registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_completo: nomeCompleto.trim(),
          cpf: cpf.trim(),
          telefone: telefone.trim(),
          senha: senha.trim(),
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
              Sua conta foi criada com sucesso. Agora faça login para solicitar o vínculo com o aluno.
            </p>
            <Link href="/responsavel/login" className={styles.submitButton} style={{ textAlign: "center", textDecoration: "none", display: "block" }}>
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
              <label className={styles.label}>CPF (opcional)</label>
              <input type="text" className={styles.input} value={cpf} onChange={(e) => setCpf(e.target.value)} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Telefone (opcional)</label>
              <input
                type="text"
                className={styles.input}
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Senha <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                className={styles.input}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Confirmar senha <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                className={styles.input}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />
            </div>

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