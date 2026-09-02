"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function EnviarMensagemPage() {
  const router = useRouter();
  const [verificandoAuth, setVerificandoAuth] = useState(true);
  const [professores, setProfessores] = useState([]);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(true);
  const [professorId, setProfessorId] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function iniciar() {
      try {
        const resAuth = await fetch(`${API_BASE}/api/coordenacao/auth`, {
          credentials: "include",
        });
        if (!resAuth.ok) {
          router.replace("/coordenacao/login");
          return;
        }
        setVerificandoAuth(false);

        const resOpcoes = await fetch(`${API_BASE}/api/coordenacao/mensagens/opcoes`, {
          credentials: "include",
        });
        if (resOpcoes.ok) {
          const data = await resOpcoes.json();
          setProfessores(data.professores || []);
        }
      } catch {
        router.replace("/coordenacao/login");
      } finally {
        setCarregandoOpcoes(false);
      }
    }
    iniciar();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (!professorId) {
      setErro("Selecione um professor.");
      return;
    }
    if (!conteudo.trim()) {
      setErro("Escreva uma mensagem.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/mensagens`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professor_id: professorId, conteudo: conteudo.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Não foi possível enviar a mensagem.");
      }
      const data = await res.json();
      router.push(`/coordenacao/mensagem/${data.conversa_id}`);
    } catch (e2) {
      setErro(e2.message);
      setEnviando(false);
    }
  }

  if (verificandoAuth) {
    return (
      <div className={styles.loadingScreen}>
        <Image src={logo} alt="SIAA-SEDUC" width={72} height={72} priority />
        <p>Verificando acesso...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        Governo do Estado do Piauí — Secretaria de Estado da Educação
      </div>

      <div className={styles.content}>
        <Link href="/coordenacao/mensagem" className={styles.voltar}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Voltar para conversas
        </Link>

        <h1 className={styles.title}>Nova mensagem</h1>

        <form className={styles.card} onSubmit={handleSubmit}>
          <label className={styles.campo}>
            <span className={styles.label}>Professor</span>
            <select
              value={professorId}
              onChange={(e) => setProfessorId(e.target.value)}
              disabled={carregandoOpcoes}
              className={styles.select}
            >
              <option value="">
                {carregandoOpcoes ? "Carregando professores..." : "Selecione um professor"}
              </option>
              {professores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome_completo}
                </option>
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