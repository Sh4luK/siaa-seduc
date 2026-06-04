import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../assets/logo.png";
import Image from "next/image";
import axios from "axios"
import { redirect } from "next/navigation"
export const metadata = {
  title: "SIAA - Sistema Integrado de Acompanhamento Acadêmico",
  description: "Sistema de integração desenvolvido por alunos da rede de ensino da escola CETI Calisto Lobo, juntamente com a SEDUC-PI",
};

export default function RootLayout({ children }) {
  // user authentication check

  const base_url = "https://animated-parakeet-97456gj46g96fp4gp-8000.app.github.dev"
  const login_url = `${base_url}/api/login/`;
  const auth_url = `${base_url}/api/auth/`;

  return (
    <html
      lang="pt-br"
      // className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        {/* <header className="p-3 mb-3 border-bottom " >
          <div className="container">
            <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
              <a href="/" className="d-flex alin-items-center mb-2 mb-lg-0 text-dark text-decoration-none">
                <Image src={logo} alt="Logo" width={100} height={100} style={{ borderRadius: "50%" }} />
              </a>
              <span className="fs-4 ms-3">SIAA - Sistema Integrado de Acompanhamento Acadêmico</span>
            </div>
          </div>
        </header> */}

        {children}
      </body>
    </html>
  );
}
