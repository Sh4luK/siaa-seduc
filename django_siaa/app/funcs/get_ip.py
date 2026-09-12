# import requests
# def get_ip():
#     url = "http://ip-api.com/json/"
#     get = requests.get(url).json()
#     ip = get["query"]

#     return ip

def get_ip(request):
    """
    Retorna o IP real de quem fez a requisição HTTP atual.

    IMPORTANTE: essa função agora exige `request` — não faz mais chamada
    a nenhum serviço externo. A versão anterior usava ip-api.com, que
    retornava o IP público de SAÍDA do próprio servidor (o mesmo valor
    pra qualquer usuário, de qualquer lugar), causando dois problemas:
      1. Todos os usuários "compartilhavam" o mesmo IP no banco.
      2. O IP podia variar entre chamadas por instabilidade do serviço
         externo (rate limit, geo-balanceamento), gerando 401
         intermitente mesmo com o usuário autenticado.

    Em ambientes atrás de proxy/túnel (como o Codespaces), o IP do
    navegador do usuário não aparece em REMOTE_ADDR (que seria o IP do
    proxy reverso), e sim no cabeçalho X-Forwarded-For, que o proxy
    adiciona automaticamente. Esse cabeçalho pode conter uma cadeia de
    IPs (cliente, proxy1, proxy2, ...) separados por vírgula — o
    primeiro da lista é o IP original do cliente.
    """
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR")

    return ip