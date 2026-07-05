"use client";

import "bootstrap/dist/css/bootstrap.min.css"
import logo from "../../../assets/logo.png"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation";


export default function AlunoLoginPage(){
    const [fullName, setFullName] = useState("")
    const [passReadOnly, setPassReadOnly] = useState(true)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [password, setPassword] = useState("")
    const [authenticated, setAuthenticated] = useState(null)
    const [loadingAuth, setLoadingAuth] = useState(true)
    const router = useRouter()

    
    async function verify_full_name(){
        if(!fullName.trim()){
            setMessage("Por favor, digite seu nome completo.")
            return
        }

        setLoading(true)
        setMessage("")

        try{
            const response = await fetch(`https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/students/search?fullname=${encodeURIComponent(fullName)}`);
            const data = await response.json();
            const clearName = (text) => {
                if (!text) return '';
                return text
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toUpperCase()
                    .trim()
                    .replace(/\s+/g, ' ');
                };
            const nameSearched = clearName(fullName.trim().toUpperCase().replace(/\s+/g, ' '))
            const studentNameOnDataBase = clearName(data?.estudante[0]?.nome_completo)
                ? data.estudante[0].nome_completo.trim().toUpperCase().replace(/\s+/g, ' ')
                : '';
            


            if (studentNameOnDataBase && studentNameOnDataBase === nameSearched) {
                setPassReadOnly(false);
                setMessage('Usuário encontrado! Agora insira sua senha.');
            } else {
                setPassReadOnly(true);
                setMessage('Estudante não encontrado no sistema.');
            }
        } catch (error) {
            console.log(error)
            setMessage('Erro ao conectar com o servidor.');
            setPassReadOnly(true);
        } finally {
            setLoading(false);
        }
    }
    async function auth_student_button(){
        try{
            const url = `https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/students/login?fullname=${encodeURIComponent(fullName)}&password=${password}`
            const student_login = await fetch(url)
            const data = await student_login.json()
            if(data.return === true){
                router.push("/aluno")
            }else{
                window.alert("Senha incorreta.")
            }
        }catch(error){
            console.log(error)
        }
        
    }
    const authUrl = "https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/students/auth"
    // const auth_student = fetch(authUrl)
    // auth_student.then(async(res)=>{
    //     const data = await res.json()
    //     if(data.return === true){
    //         window.location.href = "/aluno"
    //     }
    // }).catch((error)=> {
    //     console.log(error)
    // })
    useEffect(()=>{
        async function verifyAuthentication(){
            try{

                const url = "https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/students/auth"
                const response = await fetch(url)
                const data = await response.json()
    
                if(data.return === true){
                    setAuthenticated(true)
                    router.push("/aluno")
                }else{
                    setAuthenticated(false)
                }
            }catch(error){
                setAuthenticated(false)
            } finally{
                setLoadingAuth(false)
            }
        }

        verifyAuthentication()
    }, [router])

    if(loadingAuth){
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
        router.push("/aluno")
    }

    //style={{ backgroundColor: "#8cddaf" }}
    return (
        <div className="d-flex justify-content-center align-items-center vh-100"> 
            <div className="card shadow" style={{ borderRadius: "10px", padding: "10px" }}>
                <div className="card-body">
                    <div className="text-center">
                        <img src={logo.src} alt="Logo" className="" style={{ width: "200px", height: "auto" }} />
                    </div>
                    <h2 className="card-title text-center">Login do Aluno</h2>
                    <div className="form">
                        <label className="form-label">
                            Nome Completo <strong className="text-danger">*</strong>
                        </label>
                        <div className="mb-2">
                            <div className="d-flex">
                                <input
                                    type="text"
                                    className="form-control mx-1"
                                    name="full_name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                                <button onClick={verify_full_name} className="btn btn-primary btn-sm" disabled={loading}>
                                    {loading ? 'Verificando...' : 'Verificar'}
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
                                readOnly={passReadOnly} 
                                placeholder={passReadOnly ? "Verifique o nome primeiro" : "Digite sua senha"}
                                style={{ background: passReadOnly ? '#e9e9e9' : '#fff' }}
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            
                        </div>
                        <div className="d-grid gap-2">
                            <button onClick={auth_student_button} className="btn btn-success"><strong>Entrar</strong></button>
                        </div>
                    </div>
                </div>
                <div className="card-footer text-muted text-center">
                    <small>© 2026 SEDUC-PI. Todos os direitos reservados.</small>
                </div>
            </div>
            
        </div>
    )
}