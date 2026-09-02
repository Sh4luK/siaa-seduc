"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "https://obscure-happiness-v67rpjq7p96vfxj4g-8000.app.github.dev";

export default function CorrigirDisciplinasPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disciplinas, setDisciplinas] = useState([]);
  const [orfaos, setOrfaos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [mapaCorrecao, setMapaCorrecao] = useState({}); // nome_lecionado -> disciplina_id escolhida
  const [erros, setErros] = useState([]);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [processandoOrfao, setProcessandoOrfao] = useState(null);
  const router = useRouter();

  async function carregar() {
    try {
      const res = await fetch(`${API_BASE}/api/corrigir/disciplinas`);
      if (!res.ok) throw new Error(`Falha ao buscar (status ${res.status})`);
      const data = await res.json();
      setDisciplinas(data.disciplinas || []);
      setOrfaos(data.orfaos || []);
    } catch (error) {
      setErros([`Erro ao carregar: ${error.message}`]);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/coordenacao/login");
          return;
        }
        setAuthenticated(true);
        await carregar();
      } catch {
        router.push("/coordenacao/login");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  async function handleRenomear(disciplinaId) {
    setErros([]);
    setMensagemSucesso(null);
    try {
      const res = await fetch(`${API_BASE}/api/corrigir/disciplinas/${disciplinaId}/renomear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome_disciplina: nomeEdicao.trim() }),
      });
      const corpo = await res.text();
      if (!res.ok) {
        let msg = "Falha ao renomear.";
        try { msg = JSON.parse(corpo).message || msg; } catch {}
        throw new Error(msg);
      }
      setEditandoId(null);
      setMensagemSucesso("Disciplina renomeada com sucesso.");
      await carregar();
    } catch (error) {
      setErros([error.message]);
    }
  }

  async function handleCorrigirOrfao(nomeLecionado) {
    const disciplinaEscolhida = mapaCorrecao[nomeLecionado];
    setErros([]);
    setMensagemSucesso(null);
    setProcessandoOrfao(nomeLecionado);

    try {
      if (disciplinaEscolhida === "__nova__") {
        const resCriar = await fetch(`${API_BASE}/api/corrigir/disciplinas/criar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome_disciplina: nomeLecionado }),
        });
        if (!resCriar.ok) {
          const corpo = await resCriar.text();
          let msg = "Falha ao criar disciplina.";
          try { msg = JSON.parse(corpo).message || msg; } catch {}
          throw new Error(msg);
        }
        setMensagemSucesso(`Disciplina "${nomeLecionado}" criada — o vínculo já está resolvido.`);
      } else {
        const disciplina = disciplinas.find((d) => String(d.id) === String(disciplinaEscolhida));
        if (!disciplina) throw new Error("Selecione uma disciplina de destino.");

        const res = await fetch(`${API_BASE}/api/corrigir/disciplinas/corrigir-nome-lecionado`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome_atual: nomeLecionado, nome_correto: disciplina.nome_disciplina }),
        });
        const corpo = await res.text();
        if (!res.ok) {
          let msg = "Falha ao corrigir.";
          try { msg = JSON.parse(corpo).message || msg; } catch {}
          throw new Error(msg);
        }
        const data = JSON.parse(corpo);
        setMensagemSucesso(data.message);
      }

      await carregar();
    } catch (error) {
      setErros([error.message]);
    } finally {
      setProcessandoOrfao(null);
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
        <Link href="/corrigir" className={styles.voltarLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Correção de dados
        </Link>

        <h1 className={styles.title}>Disciplinas</h1>
        <p className={styles.subtitle}>
          Corrija nomes de disciplina e resolva vínculos que não batem com nenhuma disciplina cadastrada.
        </p>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
        {mensagemSucesso && <p className={styles.mensagemSucesso}>{mensagemSucesso}</p>}

        {orfaos.length > 0 && (
          <section className={styles.secao}>
            <h2 className={styles.secaoTitulo}>
              Vínculos órfãos
              <span className={styles.badgeAlerta}>{orfaos.length}</span>
            </h2>
            <p className={styles.secaoAjuda}>
              Estes nomes aparecem em turmas mas não batem com nenhuma disciplina cadastrada —
              é a causa mais comum do erro &quot;não foi possível resolver a disciplina&quot;.
            </p>

            <ul className={styles.lista}>
              {orfaos.map((o) => (
                <li key={o.nome_lecionado} className={styles.itemOrfao}>
                  <div className={styles.itemOrfaoInfo}>
                    <p className={styles.itemOrfaoNome}>{o.nome_lecionado}</p>
                    <p className={styles.itemOrfaoMeta}>{o.total_vinculos} vínculo(s) afetado(s)</p>
                  </div>
                  <div className={styles.itemOrfaoAcoes}>
                    <select
                      className={styles.select}
                      value={mapaCorrecao[o.nome_lecionado] || ""}
                      onChange={(e) =>
                        setMapaCorrecao((prev) => ({ ...prev, [o.nome_lecionado]: e.target.value }))
                      }
                    >
                      <option value="">Corrigir para...</option>
                      <option value="__nova__">+ Cadastrar como nova disciplina</option>
                      {disciplinas.map((d) => (
                        <option key={d.id} value={d.id}>{d.nome_disciplina}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.botaoAplicar}
                      onClick={() => handleCorrigirOrfao(o.nome_lecionado)}
                      disabled={!mapaCorrecao[o.nome_lecionado] || processandoOrfao === o.nome_lecionado}
                    >
                      {processandoOrfao === o.nome_lecionado ? "Aplicando..." : "Aplicar"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.secao}>
          <h2 className={styles.secaoTitulo}>Disciplinas cadastradas</h2>

          <ul className={styles.lista}>
            {disciplinas.map((d) => {
              const editando = editandoId === d.id;
              return (
                <li key={d.id} className={styles.item}>
                  {editando ? (
                    <>
                      <input
                        type="text"
                        className={styles.input}
                        value={nomeEdicao}
                        onChange={(e) => setNomeEdicao(e.target.value)}
                        autoFocus
                      />
                      <div className={styles.itemAcoes}>
                        <button type="button" className={styles.botaoSalvar} onClick={() => handleRenomear(d.id)}>
                          Salvar
                        </button>
                        <button type="button" className={styles.botaoCancelar} onClick={() => setEditandoId(null)}>
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.itemInfo}>
                        <p className={styles.itemNome}>{d.nome_disciplina}</p>
                        <p className={styles.itemMeta}>{d.total_vinculos} vínculo(s)</p>
                      </div>
                      <button
                        type="button"
                        className={styles.botaoEditar}
                        onClick={() => {
                          setEditandoId(d.id);
                          setNomeEdicao(d.nome_disciplina);
                        }}
                      >
                        Renomear
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}