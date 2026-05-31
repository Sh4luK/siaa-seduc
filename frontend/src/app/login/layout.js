import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios"
import { redirect } from "next/navigation"
export const metadata = {
  title: "SIAA - Sistema Integrado de Acompanhamento Acadêmico",
  description: "Sistema de integração desenvolvido por alunos da rede de ensino da escola CETI Calisto Lobo, juntamente com a SEDUC-PI",
};

export default function RootLayout({ children }) {
  const base_url = "https://animated-parakeet-97456gj46g96fp4gp-8000.app.github.dev"
  const login_url = `${base_url}/api/login/`;
  const auth_url = `${base_url}/api/auth/`;
      
  
  
  console.log("Checking authentication status...");
  const res = axios.get(auth_url, {
      method: "GET",
      headers: {
          "Content-Type": "application/json"
      }
  })
  if (res.status === 200) {
      console.log("User is authenticated");
      redirect("/dashboard");
  } else {
      console.log("User is not authenticated, redirecting to login...");
    }
    return (
      <html
        lang="pt-br"
        // className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body>
          {children}
        </body>
      </html>
    )
  // return (
  //   <html
  //     lang="pt-br"
  //     // className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
  //   >
  //     <body>
  //       {children}
  //     </body>
  //   </html>
  // );
}
