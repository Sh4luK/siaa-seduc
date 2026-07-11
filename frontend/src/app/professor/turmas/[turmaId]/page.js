"use client";

import logo from "../../../../assets/logo.png"
import Image from "next/image"
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../../page.module.css"

export default function TurmaPage() {
  const [authenticated, setAuthenticated] = useState(null)
  const { turmaId } = useParams();
  const [turma, setTurma] = useState(null);
  const [turmaLength, setTurmaLength] = useState(0)
  const [turmaName, setTurmaName] = useState("")
  const [professorId, setProfessorId] = useState("")
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("")
  const [id, setId] = useState("")
  const [senha, setSenha] = useState("")
  const [ip, setIp] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [turmas, setTurmas] = useState([])
  const [pofessor, setProfessor] = useState([])
  const [disciplinas, setDisciplinas] = useState([])
  const router = useRouter()

  useEffect(() => {
    async function verifyAuthentication() {
      try {
        const url = "https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/auth";
        const response = await fetch(url);
        const data = await response.json();

        if (data.return === true) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          router.push("/professor/login");
        }
      } catch (error) {
        setAuthenticated(false);
        router.push("/professor/login");
      } finally {
        setLoading(false);
      }
    }

    async function getData() {
      try {
        const urlAuth = "https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/auth";
        const authResponse = await fetch(urlAuth);
        if (!authResponse.ok) {
          throw new Error();
        }
        const data = await authResponse.json();

        const nome = data["teacher"]["nome_completo"] || "Não encontrado.";

        setNomeCompleto(nome);
        setSenha(data["teacher"]["senha"]);
        setIp(data["teacher"]["ip"]);
        setProfessorId(data["teacher"]["id"])
        return nome
      } catch (error) {
        setNomeCompleto("Erro ao carregar.");
        return null;
      }
    }

    async function getTurmas(nomeCompleto) {
      if (!nomeCompleto || nomeCompleto === "Não encontrado.") {
        setTurmas([]);
        return;
      }

      try {
        const urlTurmas = `https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/search/turmas?nome_completo=${encodeURIComponent(nomeCompleto)}`;
        const urlDisciplinas = `https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/search/disciplinas?nome_completo=${encodeURIComponent(nomeCompleto)}`;
        const response1 = await fetch(urlTurmas);
        const response2 = await fetch(urlDisciplinas);

        if (!response1.ok && !response2.ok) {
          throw new Error();
        }
        const data1 = await response1.json();
        const data2 = await response2.json()
        setProfessor(data1["professor"] || [])
        setTurmas(data1["turmas"] || []);
        setDisciplinas(data2["disciplinas"] || [])
      } catch (error) {
        setTurmas([]);
        setProfessor([])
      }
    }
    async function getTurma() {
      try {
        const url = `https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/search/turma?turma=${turmaId}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error()
        }

        const data = await response.json()

        console.log({ getTurma: data["turma"] })
        setTurma(data["turma"])
      } catch (error) {
        setTurma([])
      }

    }

    // async function getTurmaLength() {
    //   try {
    //     const getTurma = await fetch(`https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/search/turma?turma=${turmaId}`)
    //     // if (!getTurma.ok) {
    //     //   throw new Error()
    //     // }
    //     const getData = await getTurma.json()
    //     // console.log({ tuma: getData["turma"]["turma"] })
    //     // {
    //     //     "turma": [
    //     //       {
    //     //         "id": 443,
    //     //         "professor": 71,
    //     //         "escola": "CETI CALISTO LOBO",
    //     //         "turma": "EMTPDES-SIS-2ª SERIE - INTEGRAL-I-",
    //     //         "etapa": "2ª SERIE - INTEGRAL",
    //     //         "disciplina_lecionada": "INTELIGÊNCIA ARTIFICIAL"
    //     //       }
    //     //     ]
    //     // }
    //     // console.log({ data: encodeURIComponent(getData["turma"]["turma"])})
    //     const turmaName = encodeURIComponent(getData["turma"]["turma"])
    //     // console.log(turma)
    //     // console.log(getData["turma"]["turma"])
    //     const response = await fetch(`https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/get/alunos?turma=${encodeURIComponent(getData["turma"]["turma"])}`)
    //     console.log(response)
    //     const data = await response.json()
    //     console.log(data)

    //     // const response = await fetch(url)
    //     // if (!response.ok) {
    //     //   throw new Error()
    //     // }

    //     // const data = await response.json()
    //     // console.log(data["total"])
    //     // setTurmaLength(data["total"])
    //   } catch (error) {
    //     setTurmaLength(0)
    //   }
    // }
    // async function getTurmaLength() {
    //   try {
    //     const getTurma = await fetch(`https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/search/turma?turma=${turmaId}`)
    //     const getData = await getTurma.json()

    //     const turmaObj = getData["turma"][0] // <- pegar o primeiro item do array
    //     if (!turmaObj) {
    //       setTurmaLength(0)
    //       return
    //     }

    //     const turmaName = encodeURIComponent(turmaObj["turma"])
    //     const response = await fetch(`https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/get/alunos?turma=${turmaName}`)
    //     const data = await response.json()
    //     console.log(turmaObj)
    //     setTurmaLength(data["total"] || 0)
    //   } catch (error) {
    //     setTurmaLength(0)
    //   }
    // }
    async function getTurmaLength() {
      try {
        const getTurma = await fetch(`https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/search/turma?turma=${turmaId}`)
        const getData = await getTurma.json()
        console.log("1) getData da turma:", getData)

        const turmaObj = Array.isArray(getData["turma"]) ? getData["turma"][0] : getData["turma"]
        console.log("2) turmaObj extraído:", turmaObj)

        if (!turmaObj || !turmaObj["turma"]) {
          console.log("3) turmaObj ou turmaObj.turma está vazio/undefined")
          setTurmaLength(0)
          return
        }
        //https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/get/alunos?turma=EMTPDES-SIS-2%C2%AA%20SERIE-INTEGRAL-I-A
        const turmaName = encodeURIComponent(turmaObj["turma"])
        const urlAlunos = `https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/get/alunos?turma=${turmaName}`
        console.log("4) URL chamada:", urlAlunos)

        const response = await fetch(urlAlunos)
        console.log("5) status da resposta:", response.status)

        const data = await response.json()
        console.log("6) data retornada:", data)

        setTurmaLength(data["total"] || 0)
      } catch (error) {
        console.log("ERRO:", error)
        setTurmaLength(0)
      }
    }
    async function init() {
      await verifyAuthentication();
      const nome = await getData();
      await getTurmas(nome);
      await getTurma()
      await getTurmaLength()
    }

    init();
  }, []);

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
    console.log(turma)
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
              <Link href="/professor/calendario" className={styles.navLink}>
                <i className="ti ti-users" aria-hidden="true" />
                Calendario Escolar
              </Link>
              <Link href="/professor/frequencia" className={styles.navLink}>
                <i className="ti ti-users" aria-hidden="true" />
                Frequencia
              </Link>
              <Link href="/professor/conteudos" className={styles.navLink}>
                <i className="ti ti-users" aria-hidden="true" />
                Conteudos
              </Link>
              <Link href="/professor/atividades" className={styles.navLink}>
                <i className="ti ti-users" aria-hidden="true" />
                Atividades
              </Link>
              <Link href="/professor/avaliacoes" className={styles.navLink}>
                <i className="ti ti-users" aria-hidden="true" />
                Avaliações
              </Link>
              <Link href="/professor/notas" className={styles.navLink}>
                <i className="ti ti-edit" aria-hidden="true" />
                Lançar notas
              </Link>
              <Link href="/professor/frequencia" className={styles.navLink}>
                <i className="ti ti-clipboard-check" aria-hidden="true" />
                Frequência
              </Link>
              <Link href="/professor/horarios" className={styles.navLink}>
                <i className="ti ti-clock" aria-hidden="true" />
                Horários
              </Link>
            </nav>

            <div className={styles.sidebarFooter}>
              <div>
                <span className={styles.infoCardHeader}>
                  <span className={styles.infoCardSeal}>F</span>
                  <span className={styles.studentName}>{nomeCompleto}</span>
                </span>
              </div>
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
                {/* V/ocê está no acesso da turma de identificação(ID) {turmaId} de acordo com nossa base de dados. */}
                {nomeCompleto} está administrando a turma
              </p>

              <section className={styles.grid}>
                <Link href={`/professor/turmas/${turmaId}/alunos`} className={styles.infoCard}>
                  <div className={styles.infoCardHeader}>
                    <span className={styles.infoCardSeal}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-lines-fill" viewBox="0 0 16 16">
                        <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1z" />
                      </svg>
                    </span>
                    <div>
                      <p className={styles.infoCardTitle}>Lista de Alunos</p>
                    </div>
                  </div>
                  <div className={styles.infoCardFooter}>
                    <span className={styles.turmaAlunos}>{turmaLength} alunos</span>
                    <span className={styles.infoCardArrow} aria-hidden="true">→</span>
                  </div>
                </Link>
                <Link href={`/professor/turmas/${turmaId}/frequencia`} className={styles.infoCard}>
                  <div className={styles.infoCardHeader}>
                    <span className={styles.infoCardSeal}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-card-checklist" viewBox="0 0 16 16">
                        <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2z" />
                        <path d="M7 5.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 1 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0M7 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 0 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0" />
                      </svg>
                    </span>
                    <div>
                      <p className={styles.infoCardTitle}>Realizar Frequencia</p>
                    </div>
                  </div>
                  <div className={styles.infoCardFooter}>
                    {/* <span className={styles.turmaAlunos}></span> */}
                    <span className={styles.infoCardArrow} aria-hidden="true">→</span>
                  </div>
                </Link>
                <Link href={`/professor/turmas/${turmaId}/notificacoes`} className={styles.infoCard}>
                  <div className={styles.infoCardHeader}>
                    <span className={styles.infoCardSeal}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bell" viewBox="0 0 16 16">
                        <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6" />
                      </svg>
                    </span>
                    <div>
                      <p className={styles.infoCardTitle}>Notificações</p>
                    </div>
                  </div>
                  <div className={styles.infoCardFooter}>
                    {/* <span className={styles.turmaAlunos}></span> */}
                    <span className={styles.infoCardArrow} aria-hidden="true">→</span>
                  </div>
                </Link>
              </section>
            </main>
          </div>
        </div>
      </div>
    );
  }
  return null
}
