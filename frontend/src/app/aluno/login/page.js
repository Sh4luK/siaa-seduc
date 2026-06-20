"use client";

import "bootstrap/dist/css/bootstrap.min.css"
import logo from "../../../assets/logo.png"
import { useState } from "react"

export default function AlunoLoginPage(){
    const [cpf, setCpf] = useState("")
    const removePoints = cpf.replace(/\D/g, '');
    const verify = removePoints.length === 11
    const filledField = removePoints.length > 0
    console.log(cpf)

    return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#8cddaf" }}>
            <div className="card shadow" style={{ borderRadius: "10px", padding: "10px" }}>
                <div className="card-body">
                    <img src={logo.src} alt="Logo" className="" style={{ width: "200px", height: "auto" }} />
                    <h2 className="card-title text-center">Login do Aluno</h2>
                    <form className="form" method="POST">
                        <label className="form-label">
                            Cpf <strong className="text-danger">*</strong>
                        </label>
                        <input
                            className="form-control"
                            name="cpf"
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value)}
                            type="text"
                            placeholder="Digite seu CPF"
                            max="11"
                        />
                        <div className="mb-2">
                            {filledField && (
                                verify ? (
                                    <small className="mb-2 text-small text-success">CPF correto.</small>
                                ) : (
                                    <small className="mb-2 text-small text-danger">CPF incorreto.</small>
                                )
                            )}
                            
                        </div>
                        <label className="form-label">
                            Senha <strong className="text-danger">*</strong>
                        </label>
                        <input
                            className="form-control mb-2"
                            name="password"
                            type="password"
                            placeholder="Digite sua senha"
                        />
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