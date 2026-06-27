'use client'

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import logo from "../../assets/logo.png"
import axios from "axios"

export default function alunoPage(){
    const [authenticated, setAuthenticated] = useState(null)
    const [loading, setLoading] = useState(true)
    const [studentFullName, setStudentFullName] = useState("Carregando...")
    const router = useRouter()
    useEffect(()=>{
        async function verifyAuthentication(){
            try {
                const url = "https://friendly-space-computing-machine-7v457jp474w72q46-8000.app.github.dev/api/students/auth"
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
            const url = "https://friendly-space-computing-machine-7v457jp474w72q46-8000.app.github.dev/api/students/auth"

            fetch(url)
            .then((res)=>{
                if(!res.ok) throw new Error()
                return res.json()
            }).then((data)=>{
                setStudentFullName(data["student"]["nome_completo"] || "Não encontrado.")
            }).catch((error)=>{
                setStudentFullName("Erro ao carregar.")
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
        return (
            <div className="d-flex align-items-center justify-content-center vh-100">
                {studentFullName}
            </div>
        );
    }

    return null
}