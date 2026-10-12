from io import BytesIO
from urllib.parse import unquote

from xhtml2pdf import pisa


def _link_callback(uri, rel):
    # Aceita file:///C:/... e caminhos locais; URLs http(s) passam direto.
    if uri.startswith("file://"):
        path = unquote(uri[len("file://"):])
        if len(path) > 2 and path[0] == "/" and path[2] == ":":
            path = path[1:]  # /C:/... (Windows)
        return path
    return uri


def html_to_pdf(html_string):
    """Converte HTML em bytes de PDF (substitui o WeasyPrint, que exige libs nativas)."""
    buffer = BytesIO()
    result = pisa.CreatePDF(html_string, dest=buffer, link_callback=_link_callback, encoding="utf-8")
    if result.err:
        raise RuntimeError("Falha ao gerar o PDF")
    return buffer.getvalue()
