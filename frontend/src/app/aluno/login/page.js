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
            const response = await fetch(`${encodeURIComponent(nome)}`);
            const data = await response.json();

            if (response.ok && data.existe) {
                setSenhaReadOnly(false);
                setMensagem('Usuário encontrado! Agora insira sua senha.');
            } else {
                setSenhaReadOnly(true);
                setMensagem('Estudante não encontrado no sistema.');
            }
        } catch (error) {
            setMensagem('Erro ao conectar com o servidor.');
            setSenhaReadOnly(true);
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#8cddaf" }}>
            <div className="card shadow" style={{ borderRadius: "10px", padding: "10px" }}>
                <div className="card-body">
                    <img src={logo.src} alt="Logo" className="" style={{ width: "200px", height: "auto" }} />
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
                            />
                            <button className="btn btn-primary btn-sm" type="button">Verificar</button>
                        </div>
                        <div className="mb-2">
                            <label className="form-label">
                                Senha <strong className="text-danger">*</strong>
                            </label>
                            <input
                                type="password"
                                className="form-control"
                                readOnly
                            />
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