"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://cuddly-yodel-5gprv7xpvp7rf755x-8000.app.github.dev";

export default function EditarAdvertenciaPage() {
  const { advertenciaId } = useParams();
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tipo, setTipo] = useState("ADVERTENCIA");
  const [alvoNome, setAlvoNome] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");

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

        const res = await fetch(`${API_BASE}/api/coordenacao/advertencias/${advertenciaId}`);
        if (!res.ok) throw new Error("Registro não encontrado.");
        const responseData = await res.json();
        const a = responseData.advertencia;

        setTipo(a.tipo);
        setAlvoNome(a.tipo === "PENALIDADE" ? a.professor_nome : a.aluno_nome);
        setTitulo(a.titulo);
        setDescricao(a.descricao);
        setData(a.data);
        setIsSuspensao(a.is_suspensao || false);
        setDataInicioSuspensao(a.data_inicio_suspensao || "");
        setDataTerminoSuspensao(a.data_termino_suspensao || "");
      } catch (error) {
        setErros([`Erro ao carregar registro: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router, advertenciaId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErros([]);

    if (!titulo.trim() || !descricao.trim()) {
      setErros(["Preencha assunto e descrição."]);
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/coordenacao/advertencias/${advertenciaId}/editar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: titulo.trim(),
            descricao: descricao.trim(),
            data,
            is_suspensao: tipo === "ADVERTENCIA" ? isSuspensao : false,
            data_inicio_suspensao: tipo === "ADVERTENCIA" && isSuspensao ? dataInicioSuspensao : null,
            data_termino_suspensao: tipo === "ADVERTENCIA" && isSuspensao ? dataTerminoSuspensao : null,
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

      router.push(`/coordenacao/advertencias/${advertenciaId}`);
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
        <Link href={`/coordenacao/advertencias/${advertenciaId}`} className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Voltar
        </Link>

        <h1 className={styles.title}>Editar {tipo === "PENALIDADE" ? "penalidade" : "advertência"}</h1>
        <p className={styles.subtitle}>
          {tipo === "PENALIDADE" ? "Professor(a): " : "Aluno(a): "}
          <strong>{alvoNome}</strong>
          <br />
          <span className={styles.avisoAlvo}>O alvo do registro não pode ser alterado após a criação.</span>
        </p>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
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
            <label className={styles.label} htmlFor="titulo">Assunto</label>
            <input
              id="titulo"
              type="text"
              className={styles.input}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="descricao">Descrição da ocorrência</label>
            <textarea
              id="descricao"
              className={styles.textarea}
              rows={6}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className={styles.acoesForm}>
            <button type="submit" className={styles.enviarBotao} disabled={enviando}>
              {enviando ? "Salvando..." : "Salvar alterações"}
            </button>
            <Link href={`/coordenacao/advertencias/${advertenciaId}`} className={styles.cancelarLink}>
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}