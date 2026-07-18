"use client";

import "bootstrap/dist/css/bootstrap.min.css"
import { useState } from "react";
import { useEffect } from "react";

export default function CorrigirAlunos() {
  const [ok, setOk] = useState(false)
  const [alunos, setAlunos] = useState([]);
  const [total, setTotal] = useState(0)
  const [informations, setInformations] = useState("")
  useEffect(() => {
    async function allStudents() {
      const response = await fetch(
        "https://upgraded-space-spork-4j9vqpw9q5g5fprr-8000.app.github.dev/api/students/search",
      );
      if (!response.ok) {
        throw new Error();
        setOk(false)
      }
      const data = await response.json();
      console.log(data)
      setAlunos(data["estudante"]);
      setOk(true)
      setTotal(data["total_encontrado"])
    }

    async function init() {
      await allStudents()
    }

    init()
  }, []);

  function confirmInformations() {
    console.log("Dados enviados.")
    console.log({
      informations
    })
  }
  if (ok === true) {
    return (
      <div className="row">
        {alunos.map((aluno) => (
          <div className="col-md-6 mt-3 mb-3" key={aluno["id"]}>
            <div className="card">
              <div className="">
                <div className="card-header">
                  <span className="card-title">
                    Está correto ou não?
                  </span>
                </div>
                <div className="card-body">
                  <h5 className="">{aluno["nome_completo"]}</h5>
                  <span className="">{aluno["turma"]}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );

  }
  return null
}


// NOTA!!
// Continuar o Layout
// adicionar botoes para saber se está certo ou não
// caso nao esteja certo, informar a turma certa
