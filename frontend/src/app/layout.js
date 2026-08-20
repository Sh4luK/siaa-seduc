import "bootstrap/dist/css/bootstrap.min.css";

export const metadata = {
  title: "Sistema Integrado de Acompanhamento Acadêmico (FAPEPI/SEDUC)"
} 

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br" data-scroll-behavior="smooth">
      <body>
        {children}
      </body>
    </html>
  );
}
