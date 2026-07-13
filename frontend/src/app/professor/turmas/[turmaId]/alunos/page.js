"use client"
import { useParams } from "next/navigation";

export default function ViewAlunosPage(){
    const { turmaId } = useParams()
    return (
        <h1>{turmaId}</h1>
    )
}