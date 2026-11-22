"use client";

import { usePathname } from "next/navigation";
import CoordenacaoShell from "./components/CoordenacaoShell";

const ROTAS_SEM_SHELL = ["/coordenacao", "/coordenacao/login"];

export default function CoordenacaoLayout({ children }) {
  const pathname = usePathname();

  if (ROTAS_SEM_SHELL.includes(pathname)) {
    return children;
  }

  return <CoordenacaoShell>{children}</CoordenacaoShell>;
}
