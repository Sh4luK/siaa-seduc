/*
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
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow" style={{ width: "", padding: "", borderRadius: "10px" }}>
        <div className="card-body text-center">
          <img src={logo.src} alt="Logo" className="mb-4" style={{ width: "200px", height: "auto" }} />
          <h2 className="card-title">Bem-vindo ao SIAA</h2>
          <small className="text-muted mb-1
          ">Sistema Integrado de Acompanhamento Acadêmico</small>
          <p className="card-text mb-4">Como deseja acessar o sistema?</p>
          <div className="d-grid gap-2">
            <a href="/aluno" className="btn btn-success">Aluno</a>
            <a href="/responsavel" className="btn btn-success">Responsável</a>
            <a href="/professor" className="btn btn-success">Professor</a>
            <a href="/administrador" className="btn btn-success">Administrador</a>
          </div>
        </div>
        <div className="card-footer text-muted text-center">
          <small>&copy; 2026 SIAA</small>
        </div>
      </div>
    </div>
  )
}
*/
import Image from "next/image";
import Link from "next/link";
import logo from "../assets/logo.png";
import styles from "./page.module.css";

const ACCESS_POINTS = [
  {
    href: "/aluno",
    monogram: "A",
    label: "Aluno",
    description: "Veja notas, frequência e horários de aula.",
  },
  {
    href: "/responsavel",
    monogram: "R",
    label: "Responsável",
    description: "Acompanhe o desempenho do seu filho ou filha.",
  },
  {
    href: "/professor",
    monogram: "P",
    label: "Professor",
    description: "Lance notas, registre frequência e gerencie turmas.",
  },
  {
    href: "/administrador",
    monogram: "Ad",
    label: "Administrador",
    description: "Gerencie usuários, turmas e configurações do sistema.",
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.hall}>
        <div className={styles.masthead}>
          <Image src={logo} alt="Logo do SIAA" className={styles.logo} priority />
          <p className={styles.eyebrow}>Sistema Integrado de Acompanhamento Acadêmico</p>
          <h1 className={styles.title}>Bem-vindo ao SIAA</h1>
          <p className={styles.subtitle}>Escolha como deseja acessar o sistema.</p>
        </div>

        <div className={styles.grid}>
          {ACCESS_POINTS.map((point) => (
            <Link key={point.href} href={point.href} className={styles.tile}>
              <span className={styles.seal} aria-hidden="true">
                {point.monogram}
              </span>
              <span className={styles.tileLabel}>{point.label}</span>
              <span className={styles.tileDescription}>{point.description}</span>
              <span className={styles.tileArrow} aria-hidden="true">→</span>
            </Link>
          ))}
        </div>

        <footer className={styles.footer}>
          <span className={styles.rule} aria-hidden="true" />
          <small>&copy; 2026 SIAA · Secretaria Acadêmica</small>
        </footer>
      </div>
    </main>
  );
}