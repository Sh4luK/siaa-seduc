"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TurmaPage() {
  const [authenticated, setAuthenticated] = useState(null)
  const { turmaId } = useParams();
  const [turma, setTurma] = useState(null);
  const [turmaName, setTurmaName] = useState("")
  const [professorId, setProfessorId] = useState("")
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("")
  const [id, setId] = useState("")
  const [senha, setSenha] = useState("")
  const [ip, setIp] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [turmas, setTurmas] = useState([])
  const [pofessor, setProfessor] = useState([])
  const [disciplinas, setDisciplinas] = useState([])
  const router = useRouter()

  useEffect(()=>{
    async function verifyAuthentication() {
      try {
        const url = "https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/auth";
        const response = await fetch(url);
        const data = await response.json();

        if (data.return === true) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          router.push("/professor/login");
        }
      } catch (error) {
        setAuthenticated(false);
        router.push("/professor/login");
      } finally {
        setLoading(false);
      }
    }

    async function getData() {
      try {
        const urlAuth = "https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/auth";
        const authResponse = await fetch(urlAuth);
        if (!authResponse.ok) {
          throw new Error();
        }
        const data = await authResponse.json();

        const nome = data["teacher"]["nome_completo"] || "Não encontrado.";

        setNomeCompleto(nome);
        setSenha(data["teacher"]["senha"]);
        setIp(data["teacher"]["ip"]);
        setProfessorId(data["teacher"]["id"])
        return nome
      } catch (error) {
        setNomeCompleto("Erro ao carregar.");
        return null;
      }
    }

    async function getTurmas(nomeCompleto) {
      if (!nomeCompleto || nomeCompleto === "Não encontrado.") {
        setTurmas([]);
        return;
      }

      try {
        const urlTurmas = `https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/search/turmas?nome_completo=${encodeURIComponent(nomeCompleto)}`;
        const urlDisciplinas = `https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/search/disciplinas?nome_completo=${encodeURIComponent(nomeCompleto)}`;
        const response1 = await fetch(urlTurmas);
        const response2 = await fetch(urlDisciplinas);

        if (!response1.ok && !response2.ok) {
          throw new Error();
        }
        const data1 = await response1.json();
        const data2 = await response2.json()
        setProfessor(data1["professor"] || [])
        setTurmas(data1["turmas"] || []);
        setDisciplinas(data2["disciplinas"] || [])
      } catch (error) {
        setTurmas([]);
        setProfessor([])
      }
    }
    async function getTurma(){
      const url = `https://cautious-disco-4j9vqpw9qp7qh5r55-8000.app.github.dev/api/teacher/search/turma?turma=${turmaId}`
      const response = await fetch(url)
      
      if(!response.ok){
        throw new Error()
      }

      const data = await response.json()

      console.log(data)
    }

    async function init() {
      await verifyAuthentication();
      const nome = await getData();
      await getTurmas(nome);
      await getTurma()
    }

    init();
  }, []);
  return <div>{turmaId}</div>;
}