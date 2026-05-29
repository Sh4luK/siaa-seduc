import "bootstrap/dist/css/bootstrap.min.css";
export const metadata = {
  title: "SIAA - Sistema Integrado de Acompanhamento Acadêmico",
  description: "Sistema de integração desenvolvido por alunos da rede de ensino da escola CETI Calisto Lobo, juntamente com a SEDUC-PI",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-br"
      // className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <header className="p-3 mb-3 border-bottom">
          <div className="container">
            <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
              <a href="/" className="d-flex align-items-center mb-2 mb-lg-0 text-dark text-decoration-none">
                <img src="/logo.png" alt="Logo" width={50} height={50} />
              </a>
              <span className="fs-4 ms-3">SIAA - Sistema Integrado de Acompanhamento Acadêmico</span>
            </div>
          </div>

        </header>
        {children}
      </body>
    </html>
  );
}
