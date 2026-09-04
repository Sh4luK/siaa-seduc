 "use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import layoutStyles from "../../../page.module.css";
import styles from "../../professor/[conversaId]/page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

function formatarHora(iso) { return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
function formatarDataSeparador(iso) { return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }); }

export default function ConversaCoordenadorResponsavelPage() {
  const router = useRouter();
  const params = useParams();
  const alunoId = params.alunoId;
  const conversaId = params.conversaId;

  const [loading, setLoading] = useState(true);
  const [conversa, setConversa] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [erro, setErro] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fimDaListaRef = useRef(null);

  const carregarConversa = useCallback(async () => {
    setErro(null);
    try {
      const res = await fetch(`${API_BASE}/api/responsavel/alunos/${alunoId}/mensagem/coordenador/${conversaId}`);
      if (res.status === 404) throw new Error("Conversa não encontrada.");
      if (!res.ok) throw new Error(`Falha ao carregar conversa (status ${res.status})`);
      const data = await res.json();
      setConversa(data.conversa);
      setMensagens(data.mensagens);
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  }, [alunoId, conversaId]);

  useEffect(() => {
    async function init() {
      const authRes = await fetch(`${API_BASE}/api/responsavel/auth`);
      const authData = await authRes.json();
      if (!authData.return) {
        router.push("/responsavel/login");
        return;
      }
      await carregarConversa();
    }
    init();
  }, [router, carregarConversa]);

  useEffect(() => { fimDaListaRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens]);

  async function handleEnviar(e) {
    e.preventDefault();
    if (!novaMensagem.trim() || enviando) return;
    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/responsavel/alunos/${alunoId}/mensagem/coordenador/${conversaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: novaMensagem.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Não foi possível enviar.");
      setMensagens((atual) => [...atual, data]);
      setNovaMensagem("");
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return <div className={layoutStyles.pageLoading}><div className={layoutStyles.cardLoading}><p className={layoutStyles.subtituloLoading}>Carregando…</p></div></div>;
  }

  let ultimaDataExibida = null;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>Governo do Estado do Piauí — Secretaria de Estado da Educação</div>
      <div className={styles.content}>
        <div className={styles.cabecalho}>
          <Link href={`/responsavel/${alunoId}/mensagem`} className={styles.voltar}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          </Link>
          <div className={styles.avatar}>{conversa?.coordenador_nome?.charAt(0)?.toUpperCase() || "C"}</div>
          <span className={styles.professorNome}>{conversa?.coordenador_nome || "Coordenação"}</span>
        </div>

        {erro && <div className={styles.erro}>{erro}</div>}

        <div className={styles.corpo}>
          {mensagens.length === 0 && <p className={styles.estadoVazio}>Nenhuma mensagem ainda.</p>}
          {mensagens.map((msg) => {
            const dataMsg = formatarDataSeparador(msg.data_envio);
            const mostrarSeparador = dataMsg !== ultimaDataExibida;
            ultimaDataExibida = dataMsg;
            const éResponsavel = msg.remetente_tipo === "RESPONSAVEL";
            return (
              <div key={msg.id}>
                {mostrarSeparador && <div className={styles.separadorData}>{dataMsg}</div>}
                <div className={éResponsavel ? styles.bolhaEnviada : styles.bolhaRecebida}>
                  <p className={styles.bolhaTexto}>{msg.conteudo}</p>
                  <span className={styles.bolhaHora}>{formatarHora(msg.data_envio)}</span>
                </div>
              </div>
            );
          })}
          <div ref={fimDaListaRef} />
        </div>

        <form className={styles.rodape} onSubmit={handleEnviar}>
          <input type="text" value={novaMensagem} onChange={(e) => setNovaMensagem(e.target.value)} placeholder="Escreva uma mensagem..." className={styles.input} />
          <button type="submit" className={styles.enviarBtn} disabled={enviando || !novaMensagem.trim()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}