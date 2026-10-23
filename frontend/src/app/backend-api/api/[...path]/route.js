function obterBaseApi() {
  const base = process.env.NODE_ENV === "development"
    ? process.env.BACKEND_URL || "http://localhost:8000"
    : process.env.NEXT_PUBLIC_API_URL || "https://siaa-backend.vercel.app";

  return new URL(base);
}

async function encaminharRequisicao(request, context) {
  const { path } = await context.params;
  const urlBackend = new URL(obterBaseApi());
  urlBackend.pathname = `/api/${path.map(encodeURIComponent).join("/")}`;
  urlBackend.search = new URL(request.url).search;

  const headers = new Headers();
  for (const nome of ["accept", "content-type", "cookie", "range"]) {
    const valor = request.headers.get(nome);
    if (valor) headers.set(nome, valor);
  }

  const opcoes = {
    method: request.method,
    headers,
    cache: "no-store",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    opcoes.body = await request.arrayBuffer();
  }

  let resposta;
  try {
    resposta = await fetch(urlBackend, opcoes);
  } catch (error) {
    console.error("Falha ao encaminhar solicitação para a API:", error);
    return Response.json(
      { message: "Não foi possível conectar à API." },
      { status: 502 }
    );
  }

  const headersResposta = new Headers();
  for (const nome of ["content-type", "cache-control", "vary"]) {
    const valor = resposta.headers.get(nome);
    if (valor) headersResposta.set(nome, valor);
  }
  for (const cookie of resposta.headers.getSetCookie()) {
    headersResposta.append("set-cookie", cookie);
  }

  return new Response(
    request.method === "HEAD" ? null : await resposta.arrayBuffer(),
    {
      status: resposta.status,
      headers: headersResposta,
    }
  );
}

export async function GET(request, context) {
  return encaminharRequisicao(request, context);
}

export async function HEAD(request, context) {
  return encaminharRequisicao(request, context);
}

export async function POST(request, context) {
  return encaminharRequisicao(request, context);
}

export async function PUT(request, context) {
  return encaminharRequisicao(request, context);
}

export async function PATCH(request, context) {
  return encaminharRequisicao(request, context);
}

export async function DELETE(request, context) {
  return encaminharRequisicao(request, context);
}
