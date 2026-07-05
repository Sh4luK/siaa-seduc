'use client'

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import logo from "../../assets/logo.png"
import axios from "axios"

export default function alunoPage(){
    const [authenticated, setAuthenticated] = useState(null)
    const [loading, setLoading] = useState(true)
    const [nomeCompleto, setNomeCompleto] = useState("")
    const [periodo, setPeriodo] = useState("")
    const [escola, setEscola] = useState("")
    const [serie, setSerie] = useState("")
    const [turma, setTurma] = useState("")
    const [primeiroNome, setPrimeiroNome] = ("")
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

    if(authenticated === true){
        const firstName = nomeCompleto.split(" ")[0]
        return (
            <div className="">
            { /*
                <header className="d-flex justify-content-between p-2 border-bottom shadow">
                    <div className="d-flex">
                        <a className="d-flex align-items-center mb-3 mb-md-0 me-md-auto me-2 text-decoration-none mr-3">
                            <img src={logo.src} style={{ width: "100px", height: "auto" }} />
                            <span className="fs-4 text-dark">SIAA</span>
                        </a>
                        <ul className="nav nav-pills m-auto ms-3">
                            <li className="nav-item">
                                <a href="/" className="nav-link active">Painel</a>
                            </li>
                            <li className="nav-item">
                                <a href="/" className="nav-link">Conteudo</a>
                            </li>
                            <li className="nav-item">
                                <a href="/" className="nav-link">Atividades</a>
                            </li>
                            <li className="nav-item">
                                <a href="/" className="nav-link">Boletim</a>
                            </li>
                            <li className="nav-item">
                                <a href="/" className="nav-link">Cronograma</a>
                            </li>
                            <li className="nav-item">
                                <a href="/" className="nav-link">Horario</a>
                            </li>
                        </ul>

                    </div>
                    <div className="text-end">
                        <span className="text-muted">
                            <small className="nav nav-pills flex-column">
                                {nomeCompleto}
                                <small className="nav nav-pills flex-column">
                                    {escola}
                                    <small>
                                        {turma}
                                    </small>
                                </small>
                            </small>

                        </span>
                    </div>
                </header>
                */ }
                
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

    return null
}