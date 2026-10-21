import "./globals.css";
import LogoutButton from "../components/LogoutButton";

export const metadata = {
  title: "Sistema Integrado de Acompanhamento Acadêmico (FAPEPI/SEDUC)"
} 

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br" data-scroll-behavior="smooth">
      <body>
        {children}
        <LogoutButton />
      </body>
    </html>
  );
}
