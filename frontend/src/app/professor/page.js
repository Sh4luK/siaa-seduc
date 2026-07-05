"use client"

import logo from "../../assets/logo.png"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Professor(){
    const [authenticated, setAuthenticated] = useState(null)
    const [loading, setLoading] = useState(true)
    const [nomeCompleto, setNomeCompleto] = useState("")
    const [id, setId] = useState("")
    const [senha, setSenha] = useState("")
    const [ip, setIp] = useState("")
    const router = useRouter()

    useEffect(()=>{
        async function verifyAuthentication(){
            try{
                const url = "https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/students/auth"
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
        async function getTeacher(){
            const url = "https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/students/auth"
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
        }

        getTeacher()
        verifyAuthentication()
    }, [])

    if(loading){
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="text-center">
                    <img src={logo.src} alt="Logo" style={{ width: "200px", height: "auto" }} />
                </div>
                <p>Verificando Credenciais...</p>
            </div>
        )
    }
    if(authenticated === true){
        return (
            <div className="text-center">
                <h3>Rote Professor -&gt; Autenticado.</h3>
            </div>
        )
    }

    return null
}