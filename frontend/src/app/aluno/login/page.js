"use client";

import "bootstrap/dist/css/bootstrap.min.css"
import logo from "../../../assets/logo.png"
import { useState } from "react"

export default function AlunoLoginPage(){
    const [fullName, setFullName] = useState("")
    const [passReadOnly, setPassReadOnly] = useState(true)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    async function verify_full_name(){
        if(!fullName.trim()){
            setMessage("Por favor, digite seu nome completo.")
            return
        }

        setLoading(true)
        setMessage("")

        try{
            const response = await fetch(`https://animated-parakeet-97456gj46g96fp4gp-8000.app.github.dev/api/students/search?fullname=${encodeURIComponent(fullName)}`);
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
            
            console.log(studentNameOnDataBase)


            if (studentNameOnDataBase && studentNameOnDataBase === nameSearched) {
                console.log("total encontrado => 1")
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

    return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#8cddaf" }}>
            <div className="card shadow" style={{ borderRadius: "10px", padding: "10px" }}>
                <div className="card-body">
                    <div className="text-center">
                        <img src={logo.src} alt="Logo" className="" style={{ width: "200px", height: "auto" }} />
                    </div>
                    <h2 className="card-title text-center">Login do Aluno</h2>
                    <form className="form" method="POST">
                        <label className="form-label">
                            Nome Completo <strong className="text-danger">*</strong>
                        </label>
                        <div className="mb-2 d-flex">
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
                            />
                            {message && <p>{message}</p>}
                        </div>
                        <div className="d-grid gap-2">
                            <button type="submit" className="btn btn-success"><strong>Entrar</strong></button>
                        </div>
                        <small>
                            <a href="/aluno/cadastro">Não possui uma conta? Clique aqui.</a>
                        </small>
                    </form>
                </div>
                <div className="card-footer text-muted text-center">
                    <small>© 2026 SEDUC-PI. Todos os direitos reservados.</small>
                </div>
            </div>
            
        </div>
    )
}