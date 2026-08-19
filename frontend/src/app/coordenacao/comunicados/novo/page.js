"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev";

export default function NovoComunicadoPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [tipo, setTipo] = useState("geral"); // "geral" | "especifico"
  const [professores, setProfessores] = useState([]);
  const [professorId, setProfessorId] = useState("");
  const [turmas, setTurmas] = useState([]);
  const [turmaId, setTurmaId] = useState("");
  const [carregandoTurmas, setCarregandoTurmas] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState([]);

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

        const profRes = await fetch(`${API_BASE}/api/coordenacao/professores-simples`);
        const profData = await profRes.json();
        setProfessores(profData.professores || []);
      } catch (error) {
        setErros([`Erro ao carregar dados: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  useEffect(() => {
    if (!professorId) {
      setTurmas([]);
      setTurmaId("");
      return;
    }

    async function carregarTurmas() {
      setCarregandoTurmas(true);
      setTurmaId("");
      try {
        const res = await fetch(
          `${API_BASE}/api/coordenacao/professores/${professorId}/turmas`
        );
        const data = await res.json();
        setTurmas(data.turmas || []);
      } catch (error) {
        setErros([`Erro ao carregar turmas: ${error.message}`]);
      } finally {
        setCarregandoTurmas(false);
      }
    }

    carregarTurmas();
  }, [professorId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErros([]);

    if (!titulo.trim() || !mensagem.trim()) {
      setErros(["Preencha título e mensagem."]);
      return;
    }

    if (tipo === "especifico" && !turmaId) {
      setErros(["Escolha o professor e a turma, ou selecione 'Geral'."]);
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/comunicados/criar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          mensagem: mensagem.trim(),
          turma: tipo === "especifico" ? turmaId : null,
        }),
      });

      const corpo = await res.text();
      if (!res.ok) {
        let msg = `Falha ao criar comunicado (status ${res.status})`;
        try {
          const json = JSON.parse(corpo);
          if (json?.message) msg = json.message;
        } catch {}
        throw new Error(msg);
      }

      router.push("/coordenacao/comunicados");
    } catch (error) {
      setErros([error.message]);
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <div className={styles.headerLoading}>
            <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
            <p className={styles.subtituloLoading}>Verificando credenciais…</p>
          </div>
        </div>
      </div>
    );
  }

  if (authenticated !== true) return null;

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <Link href="/coordenacao/comunicados" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Comunicados
        </Link>

        <h1 className={styles.title}>Novo comunicado</h1>
        <p className={styles.subtitle}>Envie um aviso geral ou para uma turma específica.</p>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.campo}>
            <label className={styles.label}>Destinatário</label>
            <div className={styles.tipoOpcoes}>
              <button
                type="button"
                className={`${styles.tipoBotao} ${tipo === "geral" ? styles.tipoBotaoAtivo : ""}`}
                onClick={() => setTipo("geral")}
              >
                Geral
              </button>
              <button
                type="button"
                className={`${styles.tipoBotao} ${tipo === "especifico" ? styles.tipoBotaoAtivo : ""}`}
                onClick={() => setTipo("especifico")}
              >
                Turma específica
              </button>
            </div>
          </div>

          {tipo === "especifico" && (
            <>
              <div className={styles.campo}>
                <label className={styles.label} htmlFor="professor">Professor</label>
                <select
                  id="professor"
                  className={styles.select}
                  value={professorId}
                  onChange={(e) => setProfessorId(e.target.value)}
                >
                  <option value="">Selecione um professor</option>
                  {professores.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome_completo}</option>
                  ))}
                </select>
              </div>

              <div className={styles.campo}>
                <label className={styles.label} htmlFor="turma">Turma</label>
                <select
                  id="turma"
                  className={styles.select}
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value)}
                  disabled={!professorId || carregandoTurmas}
                >
                  <option value="">
                    {carregandoTurmas ? "Carregando turmas..." : "Selecione uma turma"}
                  </option>
                  {turmas.map((t) => (
                    <option key={t.registro_id} value={t.registro_id}>
                      {t.nome_turma} — {t.etapa}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="titulo">Título</label>
            <input
              id="titulo"
              type="text"
              className={styles.input}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reunião de pais e mestres"
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="mensagem">Mensagem</label>
            <textarea
              id="mensagem"
              className={styles.textarea}
              rows={6}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Escreva o comunicado..."
            />
          </div>

          <div className={styles.acoesForm}>
            <button type="submit" className={styles.enviarBotao} disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar comunicado"}
            </button>
            <Link href="/coordenacao/comunicados" className={styles.cancelarLink}>
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}