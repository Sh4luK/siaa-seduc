import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios"
import { redirect } from "next/navigation"


export const metadata = {
  title: "SIAA - Sistema Integrado de Acompanhamento Acadêmico",
  description: "Sistema de integração desenvolvido por alunos da rede de ensino da escola CETI Calisto Lobo, juntamente com a SEDUC-PI",
};

export default async function RootLayout({ children }) {
  // check authentication status
  const authCheck = await fetch("https://animated-parakeet-97456gj46g96fp4gp-8000.app.github.dev/api/auth/");
  const auth = await authCheck.json();
  console.log("Authentication check response:", auth);
  

  // authCheck.then(async(res) => {
  //     const data = await res.json();
  //     if(data.status === "success"){
  //         console.log(`User ${data.user.username} is already authenticated, redirecting to dashboard.`);
  //         return redirect("/dashboard");
  //     }else{
  //         console.log("User not authenticated, staying on login page.");
  //     }
  // })
  return (
    <html
      lang="pt-br"
      // className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        {children}
      </body>
    </html>
  );
}
