'use client'

import axios from "axios";
import { redirect } from "next/navigation"
import logo from "../../assets/logo.png";
import "bootstrap/dist/css/bootstrap.min.css";
import Image from "next/image";
import loginButton from "../../components/loginButton"

export default function Login(){
    const base_url = "https://animated-parakeet-97456gj46g96fp4gp-8000.app.github.dev"
    const login_url = `${base_url}/api/login/`;
    const auth_url = `${base_url}/api/auth/`;

    // using fetch
    const res = axios.get(auth_url)
    if (res.status === 200) {
        console.log("User is authenticated");
        redirect("/dashboard");
    } else {
        console.log("User is not authenticated, redirecting to login...");
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                <form method="POST" className="form-signin shadow p-4 rounded" style={{ width: "100%", maxWidth: "400px" }}>
                    <div className="d-flex justify-content-center">
                        <Image src={logo} alt="Logo" width={122} height={122} className="mb-2" />
                    </div>
                    <div className="d-flex justify-content-center mb-4">
                        <h1 className="h3 mb-3 font-weight-normal">Entrar no Sistema</h1>
                    </div>
                    <input type="text" id="inputUsername" name="username" className="form-control mb-2" placeholder="Usuário" required autoFocus />
                    <input type="password" id="inputPassword" name="password" className="form-control mb-2" placeholder="Senha" required />
                    <a href="/cadastro" className="mb-3 d-block">Criar uma nova conta</a>
                    <div className="d-grid gap-2">
                        <button className="btn btn-lg btn-primary btn-block" type="submit" onClick={loginButton}>Entrar</button>
                    </div>
                </form>

            </div>
        )
    }

    return (
        <div>
            <h2>Hello Login</h2>
        </div>
    )
}