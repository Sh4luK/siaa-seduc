"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function EditarComunicadoPage() {
  const { comunicadoId } = useParams();
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState("");

  const [tipo, setTipo] = useState("geral");
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

        const [profRes, comunicadoRes] = await Promise.all([
          fetch(`${API_BASE}/api/coordenacao/professores-simples`),
          fetch(`${API_BASE}/api/coordenacao/comunicados/${comunicadoId}`),
        ]);

        const profData = await profRes.json();
        setProfessores(profData.professores || []);

        if (!comunicadoRes.ok) throw new Error("Comunicado não encontrado.");
        const comunicadoData = await comunicadoRes.json();
        const c = comunicadoData.comunicado;

        setTitulo(c.titulo);
        setMensagem(c.mensagem);
        setData(c.data);

        if (c.turma_id) {
          setTipo("especifico");
          // Não temos o professor_id diretamente no comunicado (só a turma_id
          // referenciando AtravessaPor). Pré-selecionar o professor exigiria
          // um endpoint que devolva o professor a partir do registro de turma.
          // Por ora, deixamos o campo turma marcado via nome, e o usuário
          // reconfirma o professor/turma caso queira alterar.
          setTurmaId(String(c.turma_id));
        }
      } catch (error) {
        setErros([`Erro ao carregar dados: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router, comunicadoId]);

  useEffect(() => {
    if (!professorId) {
      setTurmas([]);
      return;
    }

    async function carregarTurmas() {
      setCarregandoTurmas(true);
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
      const res = await fetch(
        `${API_BASE}/api/coordenacao/comunicados/${comunicadoId}/editar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: titulo.trim(),
            mensagem: mensagem.trim(),
            turma: tipo === "especifico" ? turmaId : null,
            data,
          }),
        }
      );

      const corpo = await res.text();
      if (!res.ok) {
        let msg = `Falha ao salvar (status ${res.status})`;
        try {
          const json = JSON.parse(corpo);
          if (json?.message) msg = json.message;
        } catch { }
        throw new Error(msg);
      }

      router.push(`/coordenacao/comunicados/${comunicadoId}`);
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
        <Link href={`/coordenacao/comunicados/${comunicadoId}`} className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Voltar
        </Link>

        <h1 className={styles.title}>Editar comunicado</h1>

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
            <label className={styles.label} htmlFor="data">Data</label>
            <input
              id="data"
              type="date"
              className={styles.input}
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="titulo">Título</label>
            <input
              id="titulo"
              type="text"
              className={styles.input}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
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
            />
          </div>

          <div className={styles.acoesForm}>
            <button type="submit" className={styles.enviarBotao} disabled={enviando}>
              {enviando ? "Salvando..." : "Salvar alterações"}
            </button>
            <Link href={`/coordenacao/comunicados/${comunicadoId}`} className={styles.cancelarLink}>
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}