"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://humble-spoon-4j654556jr9vf5qp6-8000.app.github.dev";

export default function DeletarAdvertenciaPage() {
  const { advertenciaId } = useParams();
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advertencia, setAdvertencia] = useState(null);
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState(false);

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
        const data = await res.json();
        setAdvertencia(data.advertencia);
      } catch (error) {
        setErro(error.message);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router, advertenciaId]);

  async function handleExcluir() {
    setExcluindo(true);
    setErro("");
    try {
      const res = await fetch(
        `${API_BASE}/api/coordenacao/advertencias/${advertenciaId}/deletar`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const corpoErro = await res.text();
        let mensagem = "Não foi possível apagar o registro.";
        try {
          const json = JSON.parse(corpoErro);
          if (json?.message) mensagem = json.message;
        } catch {}
        throw new Error(mensagem);
      }

      router.push("/coordenacao/advertencias");
    } catch (error) {
      setErro(error.message);
      setExcluindo(false);
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

  if (!advertencia) {
    return (
      <div className={styles.page}>
        <div className={styles.wrapper}>
          <p className={styles.estadoErro}>{erro || "Registro não encontrado."}</p>
          <Link href="/coordenacao/advertencias" className={styles.voltarLink}>
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  const ehPenalidade = advertencia.tipo === "PENALIDADE";

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.painel}>
          <svg className={styles.iconeAlerta} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4" />
            <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
            <path d="M12 16h.01" />
          </svg>

          <h1 className={styles.titulo}>
            Apagar {ehPenalidade ? "penalidade" : "advertência"}?
          </h1>
          <p className={styles.descricao}>
            Você está prestes a apagar permanentemente o registro <strong>&ldquo;{advertencia.titulo}&rdquo;</strong>{" "}
            de {ehPenalidade ? advertencia.professor_nome : advertencia.aluno_nome}. Essa ação não pode ser desfeita.
          </p>

          {erro && <p className={styles.estadoErro}>{erro}</p>}

          <div className={styles.acoes}>
            <button
              type="button"
              className={styles.botaoConfirmar}
              onClick={handleExcluir}
              disabled={excluindo}
            >
              {excluindo ? "Apagando..." : "Sim, apagar definitivamente"}
            </button>
            <Link href={`/coordenacao/advertencias/${advertenciaId}`} className={styles.botaoCancelar}>
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}