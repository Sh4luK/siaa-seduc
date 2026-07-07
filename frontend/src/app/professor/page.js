"use client"

import logo from "../../assets/logo.png"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import styles from "./page.module.css"

export default function Professor(){
    const [authenticated, setAuthenticated] = useState(null)
    const [loading, setLoading] = useState(true)
    const [nomeCompleto, setNomeCompleto] = useState("")
    const [id, setId] = useState("")
    const [senha, setSenha] = useState("")
    const [ip, setIp] = useState("")
    const [menuOpen, setMenuOpen] = useState(false)
    const router = useRouter()

    useEffect(()=>{
        async function verifyAuthentication(){
            try{
                const url = "https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/auth"
                const response = await fetch(url)
                const data = await response.json()
                console.log(data)
                if(data.return === true){
                    setAuthenticated(true)
                }else{
                    setAuthenticated(false)
                    router.push("/professor/login")
                }
            }catch(error){
                setAuthenticated(false)
                router.push("/professor/login")
            }finally{
                setLoading(false)
            }
        }
        async function getData(){

            // ======Authentication=======
            const urlAuth = "https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/auth"
            const authResponse = await fetch(urlAuth)
            if(!authResponse.ok){
              throw new Error()
            }
            const data = await authResponse.json()

            console.log(data)
            setId(data["teacher"]["id"])
            setNomeCompleto(data["teacher"]["nome_completo"] || "Não encontrado.")
            setSenha(data["teacher"]["senha"])
            setIp(data["teacher"]["ip"])
            //============================


            //===Search Turmas===
            //===================
            
            /*
            fetch(url)
            .then((res)=>{
                if(!res.ok) throw new Error()
                return res.json()
            }).then((data)=>{
                console.log(data)
                setId(data["teacher"]["id"])
                setNomeCompleto(data["teacher"]["nome_completo"] || "Não encontrado.")
                setSenha(data["teacher"]["senha"])
                setIp(data["teacher"]["ip"])
            }).catch((error)=>{
                setNomeCompleto("Erro ao carregar.")
            })
            */
        }
        getData()
        // getTurmas()
        verifyAuthentication()
    }, [])

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
    if (authenticated === true) {
      /*
      const turmas = [
        { id: 1, nome: "9º Ano A", turno: "Matutino", alunos: 32 },
        { id: 2, nome: "9º Ano B", turno: "Matutino", alunos: 29 },
        { id: 3, nome: "1º Ano EM", turno: "Vespertino", alunos: 35 },
      ];
      */

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
                <Link href="/professor" className={styles.navLinkActive}>
                  <i className="ti ti-home" aria-hidden="true" />
                  Início
                </Link>
                <Link href="/professor/turmas" className={styles.navLink}>
                  <i className="ti ti-users" aria-hidden="true" />
                  Minhas turmas
                </Link>
                <Link href="/professor/notas" className={styles.navLink}>
                  <i className="ti ti-edit" aria-hidden="true" />
                  Lançar notas
                </Link>
                <Link href="/professor/frequencia" className={styles.navLink}>
                  <i className="ti ti-clipboard-check" aria-hidden="true" />
                  Frequência
                </Link>
                <Link href="/professor/cronograma" className={styles.navLink}>
                  <i className="ti ti-calendar" aria-hidden="true" />
                  Cronograma
                </Link>
                <Link href="/professor/horarios" className={styles.navLink}>
                  <i className="ti ti-clock" aria-hidden="true" />
                  Horários
                </Link>
              </nav>

              <div className={styles.sidebarFooter}>
                <span className={styles.studentName}>{nomeCompleto}</span>
                {/*<span className={styles.studentClass}>{disciplina}</span>*/}
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
                <span className={styles.topbarTitle}>Painel do professor</span>
              </header>

              <main className={styles.main}>
                <h1 className={styles.greeting}>Olá, {firstName}</h1>
                <p className={styles.subtitle}>
                  Bem-vindo ao Sistema Integrado de Acompanhamento Acadêmico.
                </p>

                <section className={styles.grid}>
                  {/* cards de turmas, avisos, próximas atividades etc. */}
                  
                </section>
              </main>
            </div>
          </div>
        </div>
      );
  }

  return null;
}