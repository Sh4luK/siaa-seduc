"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./page.module.css";

const SECOES = [
  { arquivo: "00-visao-geral.md", titulo: "Visão Geral & Índice" },
  { arquivo: "01-visao-geral.md", titulo: "1. Visão Geral" },
  { arquivo: "02-arquitetura.md", titulo: "2. Arquitetura" },
  { arquivo: "03-stack.md", titulo: "3. Stack Tecnológica" },
  { arquivo: "04-estrutura-repositorio.md", titulo: "4. Estrutura do Repositório" },
  { arquivo: "05-backend.md", titulo: "5. Backend — Django" },
  { arquivo: "06-modelo-de-dados.md", titulo: "6. Modelo de Dados" },
  { arquivo: "07-api-rest.md", titulo: "7. API REST" },
  { arquivo: "08-frontend.md", titulo: "8. Frontend — Next.js" },
  { arquivo: "09-modulos-funcionais.md", titulo: "9. Módulos Funcionais" },
  { arquivo: "10-fluxos.md", titulo: "10. Fluxos de Trabalho" },
  { arquivo: "11-autenticacao.md", titulo: "11. Autenticação" },
  { arquivo: "12-pdf.md", titulo: "12. Geração de PDF" },
  { arquivo: "13-seguranca.md", titulo: "13. Segurança" },
  { arquivo: "14-execucao.md", titulo: "14. Configuração e Execução" },
  { arquivo: "15-deploy.md", titulo: "15. Deploy e Infraestrutura" },
  { arquivo: "16-limitacoes.md", titulo: "16. Limitações Conhecidas" },
  { arquivo: "17-glossario.md", titulo: "17. Glossário" },
];

export default function DocumentacaoPage() {
  const [secao, setSecao] = useState(SECOES[0].arquivo);
  const [conteudo, setConteudo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      try {
        const res = await fetch(`/docs/${secao}`);
        setConteudo(await res.text());
      } catch {
        setConteudo("Erro ao carregar a documentação.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [secao]);

  const tituloAtual = SECOES.find((s) => s.arquivo === secao)?.titulo || "Documentação";

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <button className={styles.menuButton} onClick={() => setMenuAberto(!menuAberto)} aria-label="Menu">
          ☰
        </button>
        <div>
          <h1 className={styles.title}>Documentação — SIAA-SEDUC</h1>
          <p className={styles.subtitle}>{tituloAtual}</p>
        </div>
        <div className={styles.downloads}>
          <a href="/docs/DOCUMENTACAO.html" target="_blank" rel="noreferrer" className={styles.downloadBtn}>HTML</a>
          <a href="/docs/DOCUMENTACAO.pdf" target="_blank" rel="noreferrer" className={styles.downloadBtn}>PDF</a>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={`${styles.sidebar} ${menuAberto ? styles.sidebarOpen : ""}`}>
          <nav>
            {SECOES.map((s) => (
              <button
                key={s.arquivo}
                className={s.arquivo === secao ? styles.navAtivo : styles.navItem}
                onClick={() => { setSecao(s.arquivo); setMenuAberto(false); }}
              >
                {s.titulo}
              </button>
            ))}
          </nav>
        </aside>

        {menuAberto && <button className={styles.overlay} onClick={() => setMenuAberto(false)} aria-label="Fechar menu" />}

        <main className={styles.conteudo}>
          {carregando ? (
            <p className={styles.loading}>Carregando...</p>
          ) : (
            <article className={styles.markdown}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{conteudo}</ReactMarkdown>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
