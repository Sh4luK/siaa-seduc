"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "/backend-api";

export default function AdminModuloPage() {
  const { modulo } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [autenticado, setAutenticado] = useState(null);
  const [meta, setMeta] = useState(null); // {label, campos}
  const [registros, setRegistros] = useState([]);
  const [opcoes, setOpcoes] = useState({});
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(null); // {modo:'criar'|'editar', registro?, dados}
  const [erros, setErros] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/admin/auth`, { credentials: "include" });
        const authData = await authRes.json();
        if (!authData.return) {
          router.push("/admin/login");
          return;
        }
        setAutenticado(true);

        const [modRes, dadosRes, opRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/modulos`, { credentials: "include" }),
          fetch(`${API_BASE}/api/admin/modulos/${modulo}`, { credentials: "include" }),
          fetch(`${API_BASE}/api/admin/modulos/opcoes`, { credentials: "include" }),
        ]);
        const modulos = await modRes.json();
        const m = modulos.find((x) => x.slug === modulo);
        if (!m) {
          setErros(["Módulo não encontrado."]);
          setLoading(false);
          return;
        }
        setMeta(m);
        if (dadosRes.ok) setRegistros(await dadosRes.json());
        if (opRes.ok) setOpcoes(await opRes.json());
      } catch {
        setErros(["Erro ao carregar dados."]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [modulo, router]);

  const filtrados = useMemo(() => {
    if (!busca.trim()) return registros;
    const q = busca.toLowerCase();
    return registros.filter((r) => (r._titulo || "").toLowerCase().includes(q));
  }, [registros, busca]);

  function abrirCriar() {
    const dados = {};
    for (const c of meta.campos) dados[c.nome] = c.tipo === "bool" ? false : "";
    setModal({ modo: "criar", dados });
    setErros([]);
  }

  function abrirEditar(reg) {
    const dados = {};
    for (const c of meta.campos) {
      const v = reg[c.nome];
      if (c.tipo === "fk") dados[c.nome] = v?.id ?? "";
      else if (c.tipo === "choice") dados[c.nome] = v?.valor ?? v ?? "";
      else dados[c.nome] = v ?? (c.tipo === "bool" ? false : "");
    }
    setModal({ modo: "editar", id: reg.id, dados });
    setErros([]);
  }

  function setCampo(nome, valor) {
    setModal((m) => ({ ...m, dados: { ...m.dados, [nome]: valor } }));
  }

  async function salvar() {
    setSalvando(true);
    setErros([]);
    const url = modal.modo === "criar"
      ? `${API_BASE}/api/admin/modulos/${modulo}`
      : `${API_BASE}/api/admin/modulos/${modulo}/${modal.id}`;
    const res = await fetch(url, {
      method: modal.modo === "criar" ? "POST" : "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modal.dados),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErros([body.detail || "Falha ao salvar."]);
      setSalvando(false);
      return;
    }
    // recarrega lista
    const dadosRes = await fetch(`${API_BASE}/api/admin/modulos/${modulo}`, { credentials: "include" });
    if (dadosRes.ok) setRegistros(await dadosRes.json());
    setModal(null);
    setSalvando(false);
  }

  async function excluir(reg) {
    if (!confirm(`Excluir "${reg._titulo}"?`)) return;
    setExcluindo(reg.id);
    const res = await fetch(`${API_BASE}/api/admin/modulos/${modulo}/${reg.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) setRegistros((prev) => prev.filter((r) => r.id !== reg.id));
    setExcluindo(null);
  }

  function renderInput(campo) {
    const v = modal.dados[campo.nome];
    const comum = { value: v ?? "", onChange: (e) => setCampo(campo.nome, e.target.value), className: styles.input };
    if (campo.tipo === "bool") {
      return (
        <input
          type="checkbox"
          checked={!!v}
          onChange={(e) => setCampo(campo.nome, e.target.checked)}
          className={styles.check}
        />
      );
    }
    if (campo.tipo === "fk") {
      return (
        <select {...comum} value={v ?? ""}>
          <option value="">— nenhum —</option>
          {(opcoes[campo.fk] || []).map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      );
    }
    if (campo.tipo === "choice") {
      const opcoesChoice = campo.opcoes || [];
      return (
        <select {...comum}>
          {opcoesChoice.map(([val, lab]) => (
            <option key={val} value={val}>{lab}</option>
          ))}
        </select>
      );
    }
    if (campo.tipo === "text") {
      return <textarea {...comum} rows={3} value={v ?? ""} onChange={(e) => setCampo(campo.nome, e.target.value)} />;
    }
    if (campo.tipo === "date") return <input {...comum} type="date" />;
    if (campo.tipo === "time") return <input {...comum} type="time" step="60" />;
    if (campo.tipo === "decimal" || campo.tipo === "int") {
      return <input {...comum} type="number" step={campo.tipo === "decimal" ? "0.01" : "1"} />;
    }
    return <input {...comum} type="text" />;
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

  if (autenticado !== true) return null;

  // colunas da tabela: titulo + até 5 campos escalares úteis
  const colunas = meta.campos.filter((c) => !["text"].includes(c.tipo)).slice(0, 5);

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>{meta?.label || "Módulo"}</h1>
            <p className={styles.subtitle}>{registros.length} registro(s)</p>
          </div>
          <div className={styles.headerBotoes}>
            <button className={styles.voltarBotao} onClick={() => router.push("/admin")}>Voltar</button>
            <button className={styles.botaoPrimario} onClick={abrirCriar}>+ Novo</button>
          </div>
        </div>

        {erros.length > 0 && (
          <ul className={styles.listaErros}>{erros.map((e, i) => <li key={i}>{e}</li>)}</ul>
        )}

        <input
          className={styles.busca}
          placeholder="Buscar..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <div className={styles.tabelaWrap}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Registro</th>
                {colunas.map((c) => <th key={c.nome}>{c.rotulo}</th>)}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((reg) => (
                <tr key={reg.id}>
                  <td className={styles.tituloCell}>{reg._titulo}</td>
                  {colunas.map((c) => (
                    <td key={c.nome}>{formatCelula(reg[c.nome], c.tipo)}</td>
                  ))}
                  <td className={styles.acoesCell}>
                    <button className={styles.botaoEditar} onClick={() => abrirEditar(reg)}>Editar</button>
                    <button className={styles.botaoExcluir} onClick={() => excluir(reg)} disabled={excluindo === reg.id}>
                      {excluindo === reg.id ? "..." : "Excluir"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={colunas.length + 2} className={styles.vazio}>Nenhum registro.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitulo}>
              {modal.modo === "criar" ? `Novo — ${meta.label}` : `Editar — ${meta.label}`}
            </h2>
            {erros.length > 0 && (
              <ul className={styles.listaErros}>{erros.map((e, i) => <li key={i}>{e}</li>)}</ul>
            )}
            <div className={styles.formGrid}>
              {meta.campos.map((c) => (
                <div key={c.nome} className={c.tipo === "text" ? styles.campoFull : styles.campo}>
                  <label className={styles.label}>
                    {c.rotulo}{c.obrigatorio ? " *" : ""}
                  </label>
                  {renderInput(c)}
                </div>
              ))}
            </div>
            <div className={styles.modalAcoes}>
              <button className={styles.voltarBotao} onClick={() => setModal(null)}>Cancelar</button>
              <button className={styles.botaoPrimario} onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatCelula(v, tipo) {
  if (v === null || v === undefined || v === "") return "—";
  if (tipo === "fk") return v.label || "—";
  if (tipo === "choice") return v.label || v.valor || "—";
  if (tipo === "bool") return v ? "Sim" : "Não";
  if (tipo === "date") return new Date(v + "T00:00:00").toLocaleDateString("pt-BR");
  return String(v);
}
