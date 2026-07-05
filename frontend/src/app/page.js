import axios from "axios";
import { redirect } from "next/navigation"
import "bootstrap/dist/css/bootstrap.min.css";
import { Image } from "next/image";
import logo from "../assets/logo.png";

export default function Home() {
  
  return (
    // <div className="row justify-content-center align-items-center" style={{ height: "100vh", backgroundColor: "#e9ecef" }}>
    //   <div className="col-6 d-flex flex-column align-items-center justify-content-center shadow" style={{ backgroundColor: "#f8f9fa", borderRadius: "10px", padding: "20px" }}>
    //     <img src={logo.src} alt="Logo" className="mb-4" style={{ width: "200px", height: "auto" }} />
    //     <h2 className="mt-4">Bem-vindo ao SIAA</h2>
    //     <p className="text-center">O Sistema de Informação de Atividades Acadêmicas (SIAA) é uma plataforma que visa facilitar a gestão e acompanhamento das atividades acadêmicas dos alunos. Com o SIAA, os alunos podem acessar suas informações acadêmicas, como notas, frequência, horários de aulas e muito mais, de forma rápida e fácil.</p>
    //     <p>Como deseja acessar o sistema?</p>
    //     <div className="d-flex gap-3 mt-4">
    //       <button className="btn btn-primary">Aluno</button>
    //       <button className="btn btn-secondary">Professor</button>
    //       <button className="btn btn-success">Administrador</button>
    //     </div>
    //   </div>
    // </div>
    // <div className="d-flex flex-column align-items-center justify-content-center shadow" style={{ width: "50%", height: "50%", backgroundColor: "#f8f9fa", borderRadius: "10px", padding: "20px", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
    //   <img src={logo.src} alt="Logo" className="mb-4" style={{ width: "200px", height: "auto" }} />
    //   <h2 className="mt-4">Bem-vindo ao SIAA</h2>
    //   <p className="text-center">O Sistema de Informação de Atividades Acadêmicas (SIAA) é uma plataforma que visa facilitar a gestão e acompanhamento das atividades acadêmicas dos alunos. Com o SIAA, os alunos podem acessar suas informações acadêmicas, como notas, frequência, horários de aulas e muito mais, de forma rápida e fácil.</p>
    //   <p>Como deseja acessar o sistema?</p>
    //   <div className="d-flex gap-3 mt-4">
    //     <button className="btn btn-primary">Aluno</button>
    //     <button className="btn btn-secondary">Professor</button>
    //     <button className="btn btn-success">Administrador</button>
    //   </div>

      
    // </div>
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#8cddaf" }}>
      <div className="card shadow-md" style={{ width: "", padding: "", borderRadius: "10px" }}>
        <div className="card-body text-center">
          <img src={logo.src} alt="Logo" className="mb-4" style={{ width: "200px", height: "auto" }} />
          <h2 className="card-title">Bem-vindo ao SIAA</h2>
          <small className="text-muted mb-1
          ">Sistema Integrado de Acompanhamento Acadêmico</small>
          {/* <p className="card-text mb-4"></p> */}
          <p className="card-text mb-4">Como deseja acessar o sistema?</p>
          <div className="d-grid gap-2">
            <a href="/aluno" className="btn btn-success">Aluno</a>
            <a href="/responsavel" className="btn btn-success">Responsável</a>
            <a href="/professor" className="btn btn-success">Professor</a>
            <a href="/administrador" className="btn btn-success">Administrador</a>
          </div>
        </div>
        <div className="card-footer text-muted text-center">
          <small>© 2026 SEDUC-PI. Todos os direitos reservados.</small>
        </div>
      </div>
    </div>
  )
}
