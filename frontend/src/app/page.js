import axios from "axios";
import { redirect } from "next/navigation"
import "bootstrap/dist/css/bootstrap.min.css";
import { Image } from "next/image";
import logo from "../assets/logo.png";

export default function Home() {
  
  return (
    <div>
      <div className="d-flex justify-content-center align-items-center vh-100 shadow">
        <div className="text-center">
          <img src={logo.src} alt="Logo" className="mb-4" style={{ width: "200px", height: "auto" }} />
          <h1 className="mb-4">Bem-vindo ao SIAA</h1>
          <p className="mb-4">Sistema de Informação de Alunos e Aulas</p>
          <small>Defina qual modulo deseja acessar</small>
          <div className="d-grid gap-2">
            <a className="btn btn-dark mx-2 mb-1" href="/aluno">Alunos</a>
            <a className="btn btn-dark mx-2 mb-1" href="/responsavel">Responsavel</a>
            <a className="btn btn-dark mx-2 mb-1" href="/professor">Professor</a>
            <a className="btn btn-dark mx-2 mb-1" href="/coordenador">Coordenador</a>
          </div>
        </div>
      </div>
    </div>
  )
}
