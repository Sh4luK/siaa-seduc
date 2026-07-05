'use client'

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import logo from "../../assets/logo.png"
import axios from "axios"
import styles from "./page.module.css"
import Image from "next/image"
import Link from "next/link"
export default function alunoPage(){
    const [authenticated, setAuthenticated] = useState(null)
    const [loading, setLoading] = useState(true)
    const [nomeCompleto, setNomeCompleto] = useState("")
    const [periodo, setPeriodo] = useState("")
    const [escola, setEscola] = useState("")
    const [serie, setSerie] = useState("")
    const [turma, setTurma] = useState("")
    const [primeiroNome, setPrimeiroNome] = ("")
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter()

    useEffect(()=>{
        async function verifyAuthentication(){
            try {
                const url = "https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/students/auth"
                const response = await fetch(url)
                const data = await response.json()
                console.log(data)
                if(data.return === true){
                    setAuthenticated(true)
                }else{
                    setAuthenticated(false)
                    router.push("/aluno/login")
                }
            } catch(error){
                setAuthenticated(false)
                router.push("/aluno/login")
            } finally{
                setLoading(false)
            }
        }
        async function getStudent(){
            const url = "https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/students/auth"

            fetch(url)
            .then((res)=>{
                if(!res.ok) throw new Error()
                return res.json()
            }).then((data)=>{
                setNomeCompleto(data["student"]["nome_completo"] || "Não encontrado.")
                setPeriodo(data["student"]["periodo"])
                setEscola(data["student"]["escola"])
                setSerie(data["student"]["serie"])
                setTurma(data["student"]["turma"])
            }).catch((error)=>{
                setNomeCompleto("Erro ao carregar.")
            })
        }
        getStudent()
        verifyAuthentication()
    }, [router])

    /*
    if(loading){
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="text-center">
                    <img src={logo.src} alt="Logo" className="" style={{ width: "200px", height: "auto" }} />
                </div>
                <p>Verificando Credenciais...</p>
            </div>
        )
    }
    */
    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingWrap}>
                    <Image src={logo} alt="Logo do SIAA" className={styles.loadingLogo} priority />
                    <div className={styles.loadingBar}>
                        <span className={styles.loadingBarFill} />
                    </div>
                    <p className={styles.loadingText}>Verificando credenciais…</p>
                </div>
            </div>
        );
    }


    /*
    if(authenticated === true){
        const firstName = nomeCompleto.split(" ")[0]
        return (
            <div className={styles.page}>
                <header className="p-3 mb-3 border-bottom">
                    <div className="container">
                        <div className="d-flex flex-wrap align-items-center justify-content-center justifi-content-lg-start">
                            <a className="d-flex align-items-center mb-2 mb-lg-0 text-dark text-decoration-none">
                                <img src={logo.src} style={{ width: "100px", height: "auto" }} />
                            </a>
                            <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
                                <li className="px-1">
                                    <a className="btn btn-dark btn-sm" href="/aluno">Inicio</a>
                                </li>
                                <li className="px-1">
                                    <a className="btn btn-outline-dark btn-sm" href="/aluno/conteudos">Conteudos</a>
                                </li>
                                <li className="px-1">
                                    <a className="btn btn-outline-dark btn-sm" href="/aluno/atividades">Atividades</a>
                                </li>
                                <li className="px-1">
                                    <a className="btn btn-outline-dark btn-sm" href="/aluno/boletim">Boletim</a>
                                </li>
                                <li className="px-1">
                                    <a className="btn btn-outline-dark btn-sm" href="/aluno/cronograma">Cronograma</a>
                                </li>
                                <li className="px-1">
                                    <a className="btn btn-outline-dark btn-sm" href="/aluno/horarios">Horarios</a>
                                </li>
                            </ul>
                            <div className="text-end p-3 text-bg-success rounded shadow">
                                <small>{nomeCompleto}</small>
                                <br />
                                <small>{turma}</small>
                            </div>
                        </div>
                    </div>
                </header>
                
                
                <br /><br />
                <main className="container">
                    <h1 className="fs-4">Olá, {firstName}</h1>
                    <small className="text-small">Bem-vindo ao Sistema Integrado de Acompanhamento Academico</small>

                    <section className="container marketing">
                        <div className="row">
                            <div className="col-md-4">
                                
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    */
   if (authenticated === true) {
    const firstName = nomeCompleto.split(" ")[0];

    return (
        <div className={styles.page}>
        <div className={styles.shell}>
            <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
            <div className={styles.sidebarHeader}>
                <Image src={logo} alt="Logo do SIAA" className={styles.sidebarLogo} priority />
                <span className={styles.sidebarBrand}>SIAA</span>
            </div>

            <nav className={styles.nav}>
                <Link href="/aluno" className={styles.navLinkActive}>
                <i className="ti ti-home" aria-hidden="true" />
                Início
                </Link>
                <Link href="/aluno/conteudos" className={styles.navLink}>
                <i className="ti ti-book" aria-hidden="true" />
                Conteúdos
                </Link>
                <Link href="/aluno/atividades" className={styles.navLink}>
                <i className="ti ti-clipboard-list" aria-hidden="true" />
                Atividades
                </Link>
                <Link href="/aluno/boletim" className={styles.navLink}>
                <i className="ti ti-report" aria-hidden="true" />
                Boletim
                </Link>
                <Link href="/aluno/cronograma" className={styles.navLink}>
                <i className="ti ti-calendar" aria-hidden="true" />
                Cronograma
                </Link>
                <Link href="/aluno/horarios" className={styles.navLink}>
                <i className="ti ti-clock" aria-hidden="true" />
                Horários
                </Link>
            </nav>

            <div className={styles.sidebarFooter}>
                <span className={styles.studentName}>{nomeCompleto}</span>
                <span className={styles.studentClass}>{turma}</span>
            </div>
            </aside>

            {menuOpen && (
            <button
                className={styles.overlay}
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
            />
            )}

            <div className={styles.content}>
            <header className={styles.topbar}>
                <button
                className={styles.menuButton}
                aria-label="Abrir menu"
                onClick={() => setMenuOpen(true)}
                >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                </svg>

                </button>
                <span className={styles.topbarTitle}>Painel do aluno</span>
            </header>

            <main className={styles.main}>
                <h1 className={styles.greeting}>Olá, {firstName}</h1>
                <p className={styles.subtitle}>
                Bem-vindo ao Sistema Integrado de Acompanhamento Acadêmico.
                </p>

                <section className={styles.grid}>
                {/* cards de conteúdo aqui */}
                </section>
            </main>
            </div>
        </div>
        </div>
    );
    }
    return null
}