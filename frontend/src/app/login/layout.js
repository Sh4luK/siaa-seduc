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
        {children}
      </body>
    </html>
  );
}
