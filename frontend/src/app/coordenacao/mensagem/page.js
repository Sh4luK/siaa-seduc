"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

// TODO: ajuste para o import compartilhado de API_BASE que o projeto já usa
const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function formatarDataHora(iso) {
  const data = new Date(iso);
  const hoje = new Date();
  const mesmoDia = data.toDateString() === hoje.toDateString();
  if (mesmoDia) {
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function MensagemListaPage() {
  const router = useRouter();
  const [verificandoAuth, setVerificandoAuth] = useState(true);
  const [conversas, setConversas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregarConversas = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/mensagens`, {
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Não foi possível carregar as conversas.");
      }
      const data = await res.json();
      setConversas(data);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    async function verificar() {
      try {
        const res = await fetch(`${API_BASE}/api/coordenacao/auth`, {
          credentials: "include",
        });
        if (!res.ok) {
          router.replace("/coordenacao/login");
          return;
        }
        setVerificandoAuth(false);
        carregarConversas();
      } catch {
        router.replace("/coordenacao/login");
      }
    }
    verificar();
  }, [router, carregarConversas]);

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
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Mensagens</h1>
            <p className={styles.subtitle}>Converse diretamente com os professores</p>
          </div>
          <Link href="/coordenacao/mensagem/enviar" className={styles.novaMensagemBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nova mensagem
          </Link>
        </div>

        {erro && (
          <div className={styles.erro}>
            {erro}
            <button onClick={carregarConversas} className={styles.tentarNovamente}>
              Tentar novamente
            </button>
          </div>
        )}

        {carregando && !erro && (
          <p className={styles.estadoVazio}>Carregando conversas...</p>
        )}

        {!carregando && !erro && conversas.length === 0 && (
          <div className={styles.estadoVazioCard}>
            <p>Nenhuma conversa ainda.</p>
            <Link href="/coordenacao/mensagem/enviar" className={styles.linkSecundario}>
              Enviar a primeira mensagem
            </Link>
          </div>
        )}

        {!carregando && !erro && conversas.length > 0 && (
          <div className={styles.lista}>
            {conversas.map((conversa) => (
              <Link
                key={conversa.id}
                href={`/coordenacao/mensagem/${conversa.id}`}
                className={styles.card}
              >
                <div className={styles.avatar}>
                  {conversa.professor_nome?.charAt(0)?.toUpperCase() || "P"}
                </div>
                <div className={styles.cardInfo}>
                  <div className={styles.cardTopo}>
                    <span className={styles.professorNome}>{conversa.professor_nome}</span>
                    <span className={styles.dataHora}>
                      {formatarDataHora(conversa.ultima_atualizacao)}
                    </span>
                  </div>
                  <p className={styles.previaMensagem}>
                    {conversa.ultima_mensagem || "Sem mensagens ainda"}
                  </p>
                </div>
                {conversa.nao_lidas > 0 && (
                  <span className={styles.badge}>{conversa.nao_lidas}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}