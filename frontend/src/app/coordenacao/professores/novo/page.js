"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Image from "next/image";
import logo from "@/assets/logo.png";

const API_BASE = "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev";

function novoVinculo() {
  return { id: crypto.randomUUID(), turma: "", etapa: "", disciplinas: [], disciplinaSelect: "" };
}

export default function NovoProfessorPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [escola, setEscola] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [senha, setSenha] = useState("");
  const [vinculos, setVinculos] = useState([novoVinculo()]);
  const [mensagem, setMensagem] = useState(null);
  const [erros, setErros] = useState([]);

  const [opcoesTurmas, setOpcoesTurmas] = useState([]);
  const [opcoesEtapas, setOpcoesEtapas] = useState([]);
  const [opcoesDisciplinas, setOpcoesDisciplinas] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/coordenacao/auth`);
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/coordenacao/login");
          return;
        }

        const escolaRes = await fetch(`${API_BASE}/api/coordenacao/escola`);
        if (escolaRes.ok) {
          const escolaData = await escolaRes.json();
          setEscola(escolaData.escola || "");
        }

        const opcoesRes = await fetch(`${API_BASE}/api/coordenacao/opcoes-cadastro-professor`);
        if (!opcoesRes.ok) throw new Error(`Falha ao buscar opções (status ${opcoesRes.status})`);
        const opcoesData = await opcoesRes.json();

        setOpcoesTurmas(opcoesData.turmas || []);
        setOpcoesEtapas(opcoesData.etapas || []);
        setOpcoesDisciplinas(opcoesData.disciplinas || []);
      } catch (error) {
        setErros([`Erro ao carregar dados: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  function atualizarVinculo(id, campo, valor) {
    setVinculos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [campo]: valor } : v))
    );
  }

  function adicionarDisciplina(id, disciplina) {
    if (!disciplina) return;
    setVinculos((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        if (v.disciplinas.includes(disciplina)) return { ...v, disciplinaSelect: "" };
        return {
          ...v,
          disciplinas: [...v.disciplinas, disciplina],
          disciplinaSelect: "",
        };
      })
    );
  }

  function removerDisciplina(id, disciplina) {
    setVinculos((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, disciplinas: v.disciplinas.filter((d) => d !== disciplina) }
          : v
      )
    );
  }

  function adicionarVinculo() {
    setVinculos((prev) => [...prev, novoVinculo()]);
  }

  function removerVinculo(id) {
    setVinculos((prev) => (prev.length > 1 ? prev.filter((v) => v.id !== id) : prev));
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSaving(true);
    setErros([]);
    setMensagem(null);

    const errosValidacao = [];
    if (!nomeCompleto.trim()) errosValidacao.push("O nome completo é obrigatório.");
    if (!senha.trim()) errosValidacao.push("A senha é obrigatória.");

    vinculos.forEach((v, i) => {
      if (!v.turma || !v.etapa || v.disciplinas.length === 0) {
        errosValidacao.push(
          `Vínculo ${i + 1}: selecione turma, etapa e ao menos uma disciplina.`
        );
      }
    });

    if (errosValidacao.length > 0) {
      setErros(errosValidacao);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/coordenacao/professores/criar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_completo: nomeCompleto.trim(),
          senha: senha.trim(),
          escola,
          vinculos: vinculos.map((v) => ({
            turma: v.turma,
            etapa: v.etapa,
            disciplinas: v.disciplinas,
          })),
        }),
      });

      if (!res.ok) {
        const corpoErro = await res.text();
        let msg = `Falha ao cadastrar (status ${res.status})`;
        try {
          const json = JSON.parse(corpoErro);
          if (json.message) msg = json.message;
        } catch {}
        throw new Error(msg);
      }

      setMensagem("Professor cadastrado com sucesso.");
      setTimeout(() => {
        router.push("/coordenacao/professores");
      }, 900);
    } catch (error) {
      setErros([`Erro ao cadastrar professor: ${error.message}`]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.cardLoading}>
          <div className={styles.headerLoading}>
            <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
            <p className={styles.subtituloLoading}>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Novo professor</h1>
            <p className={styles.subtitle}>Cadastre um professor e seus vínculos de turma.</p>
          </div>
          <button
            type="button"
            className={styles.voltarBotao}
            onClick={() => router.push("/coordenacao/professores")}
          >
            Voltar
          </button>
        </div>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        {mensagem && <p className={styles.mensagemSucesso}>{mensagem}</p>}

        <form className={styles.form} onSubmit={handleSalvar}>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="nome_completo">
              Nome completo <span className={styles.obrigatorio}>*</span>
            </label>
            <input
              id="nome_completo"
              type="text"
              className={styles.input}
              placeholder="Ex: João da Silva"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              required
            />
          </div>

          <div className={styles.linhaDupla}>
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="escola">
                Escola
              </label>
              <input
                id="escola"
                type="text"
                className={styles.inputDesabilitado}
                value={escola || "—"}
                disabled
              />
            </div>

            <div className={styles.campo}>
              <label className={styles.label} htmlFor="senha">
                Senha de acesso <span className={styles.obrigatorio}>*</span>
              </label>
              <input
                id="senha"
                type="text"
                className={styles.input}
                placeholder="Senha para login do professor"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.secaoDivisor}>
            <h2 className={styles.secaoTitulo}>Turmas e disciplinas</h2>
            <p className={styles.secaoSubtitulo}>
              Selecione cada turma que o professor leciona, com a etapa e as disciplinas correspondentes.
            </p>
          </div>

          {vinculos.map((v, index) => (
            <div key={v.id} className={styles.vinculoCard}>
              <div className={styles.vinculoHeader}>
                <span className={styles.vinculoNumero}>Vínculo {index + 1}</span>
                {vinculos.length > 1 && (
                  <button
                    type="button"
                    className={styles.removerVinculoBotao}
                    onClick={() => removerVinculo(v.id)}
                  >
                    Remover
                  </button>
                )}
              </div>

              <div className={styles.linhaDupla}>
                <div className={styles.campo}>
                  <label className={styles.label}>
                    Turma <span className={styles.obrigatorio}>*</span>
                  </label>
                  <select
                    className={styles.select}
                    value={v.turma}
                    onChange={(e) => atualizarVinculo(v.id, "turma", e.target.value)}
                  >
                    <option value="" disabled>Selecione a turma</option>
                    {opcoesTurmas.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.campo}>
                  <label className={styles.label}>
                    Etapa <span className={styles.obrigatorio}>*</span>
                  </label>
                  <select
                    className={styles.select}
                    value={v.etapa}
                    onChange={(e) => atualizarVinculo(v.id, "etapa", e.target.value)}
                  >
                    <option value="" disabled>Selecione a etapa</option>
                    {opcoesEtapas.map((et) => (
                      <option key={et} value={et}>{et}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.campo}>
                <label className={styles.label}>
                  Disciplina(s) lecionada(s) <span className={styles.obrigatorio}>*</span>
                </label>

                {v.disciplinas.length > 0 && (
                  <div className={styles.chipsWrapper}>
                    {v.disciplinas.map((disc) => (
                      <span key={disc} className={styles.chip}>
                        {disc}
                        <button
                          type="button"
                          className={styles.chipRemover}
                          onClick={() => removerDisciplina(v.id, disc)}
                          aria-label={`Remover ${disc}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className={styles.disciplinaInputRow}>
                  <select
                    className={styles.select}
                    value={v.disciplinaSelect}
                    onChange={(e) => {
                      atualizarVinculo(v.id, "disciplinaSelect", e.target.value);
                      adicionarDisciplina(v.id, e.target.value);
                    }}
                  >
                    <option value="" disabled>Selecione uma disciplina para adicionar</option>
                    {opcoesDisciplinas
                      .filter((d) => !v.disciplinas.includes(d))
                      .map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button type="button" className={styles.adicionarVinculoBotao} onClick={adicionarVinculo}>
            + Adicionar outra turma
          </button>

          <button type="submit" className={styles.botaoSalvar} disabled={saving}>
            {saving ? "Cadastrando..." : "Cadastrar professor"}
          </button>
        </form>
      </div>
    </div>
  );
}