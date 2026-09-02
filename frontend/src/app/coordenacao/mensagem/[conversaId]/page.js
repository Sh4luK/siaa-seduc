"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatarDataSeparador(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function ConversaPage() {
  const router = useRouter();
  const params = useParams();
  const conversaId = params.conversaId;

  const [verificandoAuth, setVerificandoAuth] = useState(true);
  const [conversa, setConversa] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fimDaListaRef = useRef(null);

  // const carregarConversa = useCallback(async () => {
  //   setErro(null);
  //   try {
  //     const res = await fetch(`${API_BASE}/api/coordenacao/mensagens/${conversaId}`, {
  //       credentials: "include",
  //     });
  //     if (res.status === 404) {
  //       throw new Error("Conversa não encontrada.");
  //     }
  //     if (!res.ok) {
  //       const data = await res.json().catch(() => null);
  //       throw new Error(data?.detail || "Não foi possível carregar a conversa.");
  //     }
  //     const data = await res.json();
  //     setConversa(data.conversa);
  //     setMensagens(data.mensagens);
  //   } catch (e) {
  //     setErro(e.message);
  //   } finally {
  //     setCarregando(false);
  //   }
  // }, [conversaId]);

  // troque a função carregarConversa por estas duas:

  const carregarConversa = useCallback(async () => {
    setErro(null);
    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/mensagens/${conversaId}`, {
        credentials: "include",
      });
      if (res.status === 404) throw new Error("Conversa não encontrada.");
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Não foi possível carregar a conversa.");
      }
      const data = await res.json();
      setConversa(data.conversa);
      setMensagens(data.mensagens);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [conversaId]);

  // busca em segundo plano, sem mexer em loading/erro — só atualiza se algo mudou
  const atualizarMensagensSilenciosamente = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/mensagens/${conversaId}`, {
        credentials: "include",
      });
      if (!res.ok) return; // falha silenciosa no polling, não incomoda o usuário
      const data = await res.json();
      setMensagens((atual) =>
        atual.length !== data.mensagens.length ? data.mensagens : atual
      );
    } catch {
      // ignora falhas de polling silenciosamente
    }
  }, [conversaId]);

  // novo useEffect — adicione junto aos outros
  useEffect(() => {
    if (verificandoAuth) return;
    const intervalo = setInterval(atualizarMensagensSilenciosamente, 3000);
    return () => clearInterval(intervalo);
  }, [verificandoAuth, atualizarMensagensSilenciosamente]);


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
        carregarConversa();
      } catch {
        router.replace("/coordenacao/login");
      }
    }
    verificar();
  }, [router, carregarConversa]);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function handleEnviar(e) {
    e.preventDefault();
    if (!novaMensagem.trim() || enviando) return;

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/mensagens/${conversaId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: novaMensagem.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Não foi possível enviar a mensagem.");
      }
      const mensagemCriada = await res.json();
      setMensagens((atual) => [...atual, mensagemCriada]);
      setNovaMensagem("");
    } catch (e2) {
      setErro(e2.message);
    } finally {
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

  let ultimaDataExibida = null;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        Governo do Estado do Piauí — Secretaria de Estado da Educação
      </div>

      <div className={styles.content}>
        <div className={styles.cabecalho}>
          <Link href="/coordenacao/mensagem" className={styles.voltar}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div className={styles.avatar}>
            {conversa?.professor_nome?.charAt(0)?.toUpperCase() || "P"}
          </div>
          <span className={styles.professorNome}>
            {conversa?.professor_nome || "Carregando..."}
          </span>
        </div>

        {erro && (
          <div className={styles.erro}>
            {erro}
            <button onClick={carregarConversa} className={styles.tentarNovamente}>
              Tentar novamente
            </button>
          </div>
        )}

        <div className={styles.corpo}>
          {carregando && !erro && (
            <p className={styles.estadoVazio}>Carregando mensagens...</p>
          )}

          {!carregando && !erro && mensagens.length === 0 && (
            <p className={styles.estadoVazio}>Nenhuma mensagem ainda. Diga olá!</p>
          )}

          {!carregando &&
            mensagens.map((msg) => {
              const dataMsg = formatarDataSeparador(msg.data_envio);
              const mostrarSeparador = dataMsg !== ultimaDataExibida;
              ultimaDataExibida = dataMsg;
              const éCoordenacao = msg.remetente_tipo === "COORDENACAO";

              return (
                <div key={msg.id}>
                  {mostrarSeparador && (
                    <div className={styles.separadorData}>{dataMsg}</div>
                  )}
                  <div
                    className={
                      éCoordenacao ? styles.bolhaEnviada : styles.bolhaRecebida
                    }
                  >
                    <p className={styles.bolhaTexto}>{msg.conteudo}</p>
                    <span className={styles.bolhaHora}>
                      {formatarHora(msg.data_envio)}
                    </span>
                  </div>
                </div>
              );
            })}
          <div ref={fimDaListaRef} />
        </div>

        <form className={styles.rodape} onSubmit={handleEnviar}>
          <input
            type="text"
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            placeholder="Escreva uma mensagem..."
            className={styles.input}
            disabled={carregando}
          />
          <button
            type="submit"
            className={styles.enviarBtn}
            disabled={enviando || !novaMensagem.trim() || carregando}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}