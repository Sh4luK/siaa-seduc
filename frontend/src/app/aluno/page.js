'use client'

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function alunoPage(){
    // const authUrl = "https://animated-parakeet-97456gj46g96fp4gp-8000.app.github.dev/api/students/auth"
    // const auth_student = fetch(authUrl)
    // auth_student.then(async(res)=>{
    //     const data = await res.json()
    //     if(data.return === false){
    //         // window.location.href = "/aluno/login"
    //         return redirect("/aluno/login")
    //     }
    //     return (
    //         <div className="d-flex align-items-center justify-content-center vh-100">
    //             <h5>OLÁ MUNDO | Rota aluno.</h5>
    //         </div>
    //     )
    // }).catch((error)=>{
    //     return (
    //         <div className="text-bg-dark d-flex align-items-center justify-content-center">
    //             <h4>ERROR | {error}</h4>
    //         </div>
    //     )
    // })
    const [authenticated, setAuthenticated] = useState(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(()=>{
        async function verifyAuthentication(){
            try {
                const url = "https://animated-parakeet-97456gj46g96fp4gp-8000.app.github.dev/api/students/auth"
                const response = await fetch(url)
                const data = response.json()

                if(data && data.return === true){
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

        verifyAuthentication()
    }, [router])

    if(loading){
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                Verificando Credenciais...
            </div>
        )
    }

    if(authenticated === true){
        return (
            <div className="d-flex align-items-center justify-content-center vh-100">
                Você está autenticado!
            </div>
        );
    }

    return null
}