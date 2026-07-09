"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function TurmaPage() {
  const { turmaId } = useParams();
  const [turma, setTurma] = useState(null);
  const [loading, setLoading] = useState(true);

  return <div>{turmaId}</div>;
}