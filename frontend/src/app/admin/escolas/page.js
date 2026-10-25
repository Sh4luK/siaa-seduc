"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "./page.module.css";

const API_BASE = "/backend-api";

export default function AdminEscolasPage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [escolas, setEscolas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [stats, setStats] = useState({ coordenadores: 0, professores: 0, alunos: 0 });
  const [formData, setFormData] = useState({ nome: "", inep: "", endereco: "", contato: "" });
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`${API_BASE}/api/admin/auth`, { credentials: "include" });
        const authData = await authRes.json();

        if (!authData.return) {
          router.push("/admin/login");
          return;
        }
        setAuthenticated(true);
        await Promise.all([carregarEscolas(), carregarStats()]);
      } catch (error) {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function carregarEscolas() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/escolas`, { credentials: "include" });
      const data = await res.json();
      setEscolas(data || []);
    } catch (error) {
      console.error("Erro ao carregar escolas:", error);
    }
  }

  async function carregarStats() {
    try {
      const [coordRes, profRes, alunosRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/coordenadores`, { credentials: "include" }),
        fetch(`${API_BASE}/api/admin/professores`, { credentials: "include" }),
        fetch(`${API_BASE}/api/admin/alunos`, { credentials: "include" }),
      ]);

      const coordData = coordRes.ok ? await coordRes.json() : [];
      const profData = profRes.ok ? await profRes.json() : [];
      const alunosData = alunosRes.ok ? await alunosRes.json() : [];

      setStats({
        coordenadores: coordData.length || 0,
        professores: profData.length || 0,
        alunos: alunosData.length || 0,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  }

  function handleNovo() {
    setEditando(null);
    setFormData({ nome: "", inep: "", endereco: "", contato: "" });
    setMostrarFormulario(true);
  }

  function handleEditar(escola) {
    setEditando(escola);
    setFormData({
      nome: escola.nome,
      inep: escola.inep || "",
      endereco: escola.endereco || "",
      contato: escola.contato || ""
    });
    setMostrarFormulario(true);
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);

    try {
      const res = await fetch(`${API_BASE}/api/admin/escolas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMostrarFormulario(false);
        setFormData({ nome: "", inep: "", endereco: "", contato: "" });
        await carregarEscolas();
      } else {
        const error = await res.json();
        alert(error.detail || "Erro ao salvar escola");
      }
    } catch (error) {
      console.error("Erro ao salvar escola:", error);
      alert("Erro ao salvar escola");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(id) {
    if (!confirm("Tem certeza que deseja excluir esta escola?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/escolas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        await carregarEscolas();
      }
    } catch (error) {
      console.error("Erro ao excluir escola:", error);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  if (authenticated !== true) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/admin" className={styles.backLink}>
          ← Voltar ao painel
        </Link>
        <h1>Escolas</h1>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{stats.coordenadores}</span>
          <span className={styles.statLabel}>Coordenadores</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{stats.professores}</span>
          <span className={styles.statLabel}>Professores</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{stats.alunos}</span>
          <span className={styles.statLabel}>Alunos</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.listCard}>
          <div className={styles.listHeader}>
            <h2>Escolas Cadastradas ({escolas.length})</h2>
            <button onClick={handleNovo} className={styles.addButton}>
              + Nova Escola
            </button>
          </div>

          {mostrarFormulario && (
            <div className={styles.formContainer}>
              <h3>{editando ? "Editar Escola" : "Nova Escola"}</h3>
              <form onSubmit={handleSalvar}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label>Nome *</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label>INEP</label>
                    <input
                      type="text"
                      value={formData.inep}
                      onChange={(e) => setFormData({ ...formData, inep: e.target.value })}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label>Endereço</label>
                  <textarea
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className={styles.field}>
                  <label>Contato</label>
                  <input
                    type="text"
                    value={formData.contato}
                    onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                  />
                </div>
                <div className={styles.formActions}>
                  <button type="button" onClick={() => setMostrarFormulario(false)} className={styles.cancelButton}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={salvando} className={styles.saveButton}>
                    {salvando ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className={styles.list}>
            {escolas.length === 0 ? (
              <p className={styles.empty}>Nenhuma escola cadastrada.</p>
            ) : (
              escolas.map((escola) => (
                <div key={escola.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <strong>{escola.nome}</strong>
                    {escola.inep && <span>INEP: {escola.inep}</span>}
                    {escola.endereco && <span>📍 {escola.endereco}</span>}
                    {escola.contato && <span>📞 {escola.contato}</span>}
                  </div>
                  <div className={styles.itemActions}>
                    <button onClick={() => handleEditar(escola)} className={styles.editButton}>
                      Editar
                    </button>
                    <button onClick={() => handleExcluir(escola.id)} className={styles.deleteButton}>
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogos}>
            <Image src={logo} alt="Logo do SIAA" className={styles.footerLogoSiaa} priority />
            <span className={styles.footerSeparator}>|</span>
            <span className={styles.footerSeduc}>SEDUC-PI</span>
          </div>
          <span className={styles.footerText}>© 2026 SEDUC-PI. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
