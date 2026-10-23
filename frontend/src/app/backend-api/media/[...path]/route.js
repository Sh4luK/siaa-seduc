function getBackendBaseUrl() {
  const url = process.env.NODE_ENV === "development"
    ? process.env.BACKEND_URL || "http://localhost:8000"
    : process.env.NEXT_PUBLIC_API_URL || "https://siaa-backend.vercel.app";

  return new URL(url);
}

async function encaminharArquivo(request, context) {
  const { path } = await context.params;
  const backendUrl = getBackendBaseUrl();
  const arquivoPath = path.map(encodeURIComponent).join("/");
  const url = new URL(`/media/${arquivoPath}`, backendUrl);
  url.search = new URL(request.url).search;

  const headersRecebidos = new Headers();
  for (const nome of ["range", "if-none-match", "if-modified-since"]) {
    const valor = request.headers.get(nome);
    if (valor) headersRecebidos.set(nome, valor);
  }

  let arquivo;
  try {
    arquivo = await fetch(url, {
      method: request.method,
      headers: headersRecebidos,
      cache: "no-store",
    });
  } catch (error) {
    console.error("Falha ao buscar mídia do backend:", error);
    return new Response("Não foi possível carregar o arquivo da atividade.", { status: 502 });
  }

  const headersResposta = new Headers(arquivo.headers);
  headersResposta.delete("x-frame-options");
  headersResposta.set("content-security-policy", "frame-ancestors 'self'");

  return new Response(request.method === "HEAD" ? null : arquivo.body, {
    status: arquivo.status,
    statusText: arquivo.statusText,
    headers: headersResposta,
  });
}

export async function GET(request, context) {
  return encaminharArquivo(request, context);
}

export async function HEAD(request, context) {
  return encaminharArquivo(request, context);
}
