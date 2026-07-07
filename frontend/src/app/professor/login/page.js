"use client"

import "bootstrap/dist/css/bootstrap.min.css"
import logo from "../../../assets/logo.png"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import styles from "../page.module.css"
import Image from "next/image"
export default function ProfessorLoginPage() {
    const [nomeCompleto, setNomeCompleto] = useState("")
    const [senhaReadOnly, setSenhaReadOnly] = useState(true)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [password, setPassword] = useState("")
    const [authenticated, setAuthenticated] = useState(null)
    const [loadingAuth, setloadingAuth] = useState(true)
    const [error, setError] = useState("")
    const router = useRouter()

    async function verify_full_name() {
        if (!nomeCompleto.trim()) {
            setMessage("Por favor, digite seu nome completo.")
            return
        }

        setLoading(true)
        setMessage("")

        try {
            const response = await fetch(`https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/search?nome_completo=${encodeURIComponent(nomeCompleto)}`)
            const data = await response.json()
            const clearName = (text) => {
                if (!text) return '';
                return text
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toUpperCase()
                    .trim()
                    .replace(/\s+/g, ' ');
            };
            const nameSearched = clearName(nomeCompleto.trim().toUpperCase().replace(/\s+/g, ' '))
            const teacherNameOnDataBase = clearName(data?.teacher?.nome_completo)
                ? data.teacher.nome_completo.trim().toUpperCase().replace(/\s+/g, ' ')
                : '';

            if (teacherNameOnDataBase && teacherNameOnDataBase === nameSearched) {
                setSenhaReadOnly(false)
                setMessage("Usuário encontrado! Agora insira sua senha.")
            } else {
                setSenhaReadOnly(true)
                setMessage("Estudante não encontrado no sistema.")
            }
        } catch (error) {
            console.log(error)
            setMessage("Erro ao conectar com o servidor.")
            setSenhaReadOnly(true)
        } finally {
            setLoading(false)
        }
    }
    async function auth_teacher_button() {
        try {
            const url = `https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/login?nome_completo=${encodeURIComponent(nomeCompleto)}&senha=${password}`
            const teacher_login = await fetch(url)
            const data = await teacher_login.json()
            if (data.return === true) {
                router.push("/professor")
            } else {
                setError("Nome completo ou senha incorretos. Verifique suas credenciais.")
            }
        } catch (error) {
            console.log(error)
            setError("Usuário não encontrado! Verifique suas credenciais.")
        }
    }
    useEffect(() => {
        async function verifyAuth() {
            try {
                const url = "https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/auth"
                const response = await fetch(url)
                const data = await response.json()

                if (data.return === true) {
                    setAuthenticated(true)
                    router.push("/professor")
                } else {
                    setAuthenticated(false)
                }
            } catch (error) {
                setAuthenticated(false)
            } finally {
                setloadingAuth(false)
            }
        }

        verifyAuth()
    }, [router])

    if (loadingAuth) {
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="text-center">
                <img src={logo.src} alt="Logo" style={{ width: "200px", height: "auto" }} />
                <p>Verificando Credenciais...</p>
            </div>
        </div>
    }

    if (authenticated === true) {
        router.push("/professor")
    }

    /*
    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="card shadow" style={{ padding: "10px", borderRadius: "10px" }}>
                <div className="card-body">
                    <div className="text-center">
                        <img src={logo.src} alt="Logo" style={{ width: "200px", height: "auto" }} />
                    </div>
                    <h2 className="card-title text-center">Login do Professor</h2>
                    <div className="form">
                        <label className="form-label">
                            Nome Completo <strong className="text-danger">*</strong>
                        </label>
                        <div className="mb-2">
                            <div className="d-flex">
                                <input
                                    type="text"
                                    className="form-control mx-1"
                                    name="nome_completo"
                                    value={nomeCompleto}
                                    onChange={(e) => setNomeCompleto(e.target.value)}
                                />
                                <button onClick={verify_full_name} className="btn btn-sm btn-outline-success" disabled={loading}>
                                    {loading ? "Verificando..." : "Verificar"}
                                </button>
                            </div>
                            {message && <small className="text-muted">{message}</small>}
                        </div>
                        <div className="mb-2">
                            <label className="form-label">
                                Senha <strong className="text-danger">*</strong>
                            </label>
                            <input
                                type="password"
                                readOnly={senhaReadOnly}
                                placeholder={senhaReadOnly ? "Verifique o nome primeiro" : "Digite sua senha"}
                                style={{ background: senhaReadOnly ? "#e9e9e9" : "#ffffff" }}
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="d-grid gap-2">
                            <button onClick={auth_teacher_button} className="btn btn-success"><strong>Entrar</strong></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
    */
    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.cardBody}>
                    <div className={styles.masthead}>
                        <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
                        <p className={styles.eyebrow}>SIAA · Acesso do professor</p>
                        <h2 className={styles.title}>Login do professor</h2>
                    </div>

                    <div className={styles.form}>
                        <div className={styles.field}>
                            <label className={styles.label}>
                                Nome Completo <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                className={styles.input}
                                name="matricula"
                                value={nomeCompleto}
                                onChange={(e) => setNomeCompleto(e.target.value)}
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>
                                Senha <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="password"
                                className={styles.input}
                                placeholder="Digite sua senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {/* {message && <small className={styles.hint}>{message}</small>} */}
                        {error && (
                            <div className={styles.errorBox} role="alert">
                                <span className={styles.errorIcon} aria-hidden="true">!</span>
                                <small>{error}</small>
                            </div>
                        )}

                        <button
                            onClick={auth_teacher_button}
                            className={styles.submitButton}
                            disabled={loading}
                        >
                            {loading ? "Entrando…" : "Entrar"}
                        </button>
                    </div>
                </div>

                <footer className={styles.footer}>
                    <small>&copy; 2026 SEDUC-PI. Todos os direitos reservados.</small>
                </footer>
            </div>
        </div>
    );
}