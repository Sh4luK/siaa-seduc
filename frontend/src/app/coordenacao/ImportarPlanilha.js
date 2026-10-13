"use client";

import { useRef, useState } from "react";
import styles from "./ImportarPlanilha.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Mesmas colunas dos arquivos exportados em JSON (alunosExportados.json etc.).
const TIPOS = {
  alunos: {
    titulo: "alunos",
    colunas: "id, posicao_ordem, nome_completo, escola, modo_de_ensino, serie, periodo, curso, turma, senha, ip",
    dica: "Só nome_completo é obrigatório. Sem senha, o aluno entra com 12345678.",
  },
  professores: {
    titulo: "professores",
    colunas: "id, nome_completo, senha, ip",
    dica: "Só nome_completo é obrigatório. Sem senha, ela fica como o primeiro nome seguido de 123.",
  },
  turmas: {
    titulo: "turmas",
    colunas: "id, professor, escola, turma, etapa, disciplina_lecionada",
    dica: "Cada linha liga um professor já cadastrado (id ou nome completo) a uma turma e disciplina.",
  },
  disciplinas: {
    titulo: "disciplinas",
    colunas: "id, nome_disciplina, professores",
    dica: "Só nome_disciplina é obrigatório. Em professores, liste ids ou nomes completos separados por vírgula.",
  },
};

export default function ImportarPlanilha({ tipo, onImportado }) {
  const config = TIPOS[tipo];
  const [aberto, setAberto] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [resultado, setResultado] = useState(null);
  const inputRef = useRef(null);

  async function handleBaixarModelo() {
    setErro(null);
    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/importar/${tipo}/modelo`, { credentials: "include" });
      if (!res.ok) throw new Error(`Falha ao baixar o modelo (status ${res.status})`);
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `modelo_${tipo}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErro(error.message);
    }
  }

  async function handleEnviar() {
    if (!arquivo) return;
    setEnviando(true);
    setErro(null);
    setResultado(null);

    try {
      const corpo = new FormData();
      corpo.append("arquivo", arquivo);

      const res = await fetch(`${API_BASE}/api/coordenacao/importar/${tipo}`, {
        method: "POST",
        credentials: "include",
        body: corpo,
      });
      const texto = await res.text();
      let data = {};
      try { data = JSON.parse(texto); } catch {}
      if (!res.ok) throw new Error(data.message || `Falha ao importar (status ${res.status})`);

      setResultado(data);
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = "";
      if (onImportado) await onImportado();
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={styles.bloco}>
      <button type="button" className={styles.botaoAbrir} onClick={() => setAberto(!aberto)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3v4a1 1 0 0 0 1 1h4" />
          <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
          <path d="M12 11v6" />
          <path d="M9.5 13.5l2.5 -2.5l2.5 2.5" />
        </svg>
        {aberto ? "Fechar importação" : `Importar ${config.titulo} do Excel`}
      </button>

      {aberto && (
        <div className={styles.painel}>
          <p className={styles.texto}>
            Envie uma planilha <strong>.xlsx</strong> com os nomes das colunas na primeira linha e um
            registro por linha. Colunas: <code className={styles.colunas}>{config.colunas}</code>
          </p>
          <p className={styles.texto}>
            {config.dica} Linhas com um <strong>id</strong> que já existe atualizam o registro; as demais
            são cadastradas, e nomes já cadastrados são ignorados.
          </p>

          <div className={styles.acoes}>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className={styles.arquivo}
              aria-label="Planilha do Excel"
              onChange={(e) => setArquivo(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              className={styles.botaoEnviar}
              onClick={handleEnviar}
              disabled={!arquivo || enviando}
            >
              {enviando ? "Enviando…" : "Enviar planilha"}
            </button>
            <button type="button" className={styles.botaoModelo} onClick={handleBaixarModelo}>
              Baixar modelo
            </button>
          </div>

          {erro && <p className={styles.erro}>{erro}</p>}

          {resultado && (
            <div className={styles.resultado}>
              <p className={styles.resultadoResumo}>{resultado.message}</p>
              {resultado.erros?.length > 0 && (
                <ul className={styles.resultadoErros}>
                  {resultado.erros.map((e, i) => <li key={i}>{e}</li>)}
                  {resultado.total_erros > resultado.erros.length && (
                    <li>… e mais {resultado.total_erros - resultado.erros.length} linha(s) com erro.</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
