"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function formatarDataHora(iso) {
  const data = new Date(iso);
  const hoje = new Date();
  if (data.toDateString() === hoje.toDateString()) {
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function MensagemListaPage() {
  const router = useRouter();
  const [verificandoAuth, setVerificandoAuth] = useState(true);
  const [aba, setAba] = useState("professores"); // "professores" | "responsaveis"
  const [conversasProfessores, setConversasProfessores] = useState([]);
  const [conversasResponsaveis, setConversasResponsaveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregarTudo = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [resProf, resResp] = await Promise.all([
        fetch(`${API_BASE}/api/coordenacao/mensagens`, { credentials: "include" }),
        fetch(`${API_BASE}/api/coordenacao/mensagens/responsaveis`, { credentials: "include" }),
      ]);
      if (resProf.ok) setConversasProfessores(await resProf.json());
      if (resResp.ok) setConversasResponsaveis(await resResp.json());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  // mantenha carregarTudo como está para o load inicial e o botão "Tentar novamente"

  // nova função — atualização silenciosa
  const atualizarTudoSilenciosamente = useCallback(async () => {
    try {
      const [resProf, resResp] = await Promise.all([
        fetch(`${API_BASE}/api/coordenacao/mensagens`, { credentials: "include" }),
        fetch(`${API_BASE}/api/coordenacao/mensagens/responsaveis`, { credentials: "include" }),
      ]);
      if (resProf.ok) setConversasProfessores(await resProf.json());
      if (resResp.ok) setConversasResponsaveis(await resResp.json());
    } catch {
      // falha silenciosa no polling
    }
  }, []);

  // novo useEffect — adicione junto ao que já verifica auth
  useEffect(() => {
    if (verificandoAuth) return;
    const intervalo = setInterval(atualizarTudoSilenciosamente, 6000);
    return () => clearInterval(intervalo);
  }, [verificandoAuth, atualizarTudoSilenciosamente]);

  useEffect(() => {
    async function verificar() {
      try {
        const res = await fetch(`${API_BASE}/api/coordenacao/auth`, { credentials: "include" });
        const data = await res.json();
        if (!data.return) {
          router.replace("/coordenacao/login");
          return;
        }
        setVerificandoAuth(false);
        carregarTudo();
      } catch {
        router.replace("/coordenacao/login");
      }
    }
    verificar();
  }, [router, carregarTudo]);

  if (verificandoAuth) {
    return (
      <div className={styles.loadingScreen}>
        <p>Verificando acesso...</p>
      </div>
    );
  }

  const conversasAtivas = aba === "professores" ? conversasProfessores : conversasResponsaveis;
  const basePath = aba === "professores" ? "/coordenacao/mensagem" : "/coordenacao/mensagem/responsavel";

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>Governo do Estado do Piauí — Secretaria de Estado da Educação</div>

      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Mensagens</h1>
            <p className={styles.subtitle}>Converse com professores e responsáveis</p>
          </div>
          {aba === "professores" && (
            <Link href="/coordenacao/mensagem/enviar" className={styles.novaMensagemBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Nova mensagem
            </Link>
          )}
        </div>

        <div className={styles.abasRow}>
          <button className={aba === "professores" ? styles.abaAtiva : styles.aba} onClick={() => setAba("professores")}>
            Professores
            {conversasProfessores.some((c) => c.nao_lidas > 0) && <span className={styles.pontoNaoLido} />}
          </button>
          <button className={aba === "responsaveis" ? styles.abaAtiva : styles.aba} onClick={() => setAba("responsaveis")}>
            Responsáveis
            {conversasResponsaveis.some((c) => c.nao_lidas > 0) && <span className={styles.pontoNaoLido} />}
          </button>
        </div>

        {erro && (
          <div className={styles.erro}>
            {erro}
            <button onClick={carregarTudo} className={styles.tentarNovamente}>Tentar novamente</button>
          </div>
        )}

        {carregando && !erro && <p className={styles.estadoVazio}>Carregando conversas...</p>}

        {!carregando && !erro && conversasAtivas.length === 0 && (
          <div className={styles.estadoVazioCard}>
            <p>{aba === "professores" ? "Nenhuma conversa ainda." : "Nenhuma conversa com responsáveis ainda."}</p>
          </div>
        )}

        {!carregando && !erro && conversasAtivas.length > 0 && (
          <div className={styles.lista}>
            {conversasAtivas.map((c) => (
              <Link key={c.id} href={`${basePath}/${c.id}`} className={styles.card}>
                <div className={styles.avatar}>
                  {(aba === "professores" ? c.professor_nome : c.responsavel_nome)?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className={styles.cardInfo}>
                  <div className={styles.cardTopo}>
                    <span className={styles.professorNome}>
                      {aba === "professores" ? c.professor_nome : c.responsavel_nome}
                    </span>
                    <span className={styles.dataHora}>{formatarDataHora(c.ultima_atualizacao)}</span>
                  </div>
                  {aba === "responsaveis" && <span className={styles.alunoTag}>Aluno: {c.aluno_nome}</span>}
                  <p className={styles.previaMensagem}>{c.ultima_mensagem || "Sem mensagens ainda"}</p>
                </div>
                {c.nao_lidas > 0 && <span className={styles.badge}>{c.nao_lidas}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}