import hashlib
import hmac
import html
import json
import mimetypes
import os
import re
import zipfile
from html.parser import HTMLParser
from io import BytesIO
from datetime import datetime
from urllib.parse import urlparse
from xml.etree import ElementTree

import markdown
from PIL import Image, ImageSequence
from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.platypus import Flowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from django.utils import timezone


def assinatura_hmac(dados, chave):
    mensagem = json.dumps(
        dados,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hmac.new(chave.encode("utf-8"), mensagem, hashlib.sha256).hexdigest()


def _texto_pdf(value):
    return html.escape(str(value or "")).replace("\n", "<br/>")


class _MarkdownFlowableParser(HTMLParser):
    INLINE_TAGS = {
        "strong": "b",
        "b": "b",
        "em": "i",
        "i": "i",
        "del": "strike",
        "s": "strike",
        "strike": "strike",
        "sup": "super",
        "sub": "sub",
    }
    BLOCK_TAGS = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "li"}

    def __init__(self, styles):
        super().__init__(convert_charrefs=True)
        self.styles = styles
        self.flowables = []
        self.fragments = []
        self.style = styles["MarkdownCorpoSIAA"]
        self.inline_tags = []
        self.list_stack = []
        self.ignored_tags = []

    def _flush(self):
        content = "".join(self.fragments).strip()
        self.fragments.clear()
        if content:
            self.flowables.append(Paragraph(content, self.style))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if self.ignored_tags:
            if tag in {"script", "style"}:
                self.ignored_tags.append(tag)
            return
        if tag in {"script", "style"}:
            self._flush()
            self.ignored_tags.append(tag)
        elif tag in {"p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre"}:
            self._flush()
            self.style = self.styles.get(f"Markdown{tag.title()}SIAA", self.styles["MarkdownCorpoSIAA"])
        elif tag in {"ul", "ol"}:
            self._flush()
            self.list_stack.append({"ordered": tag == "ol", "count": 0})
        elif tag == "li":
            self._flush()
            if self.list_stack:
                current = self.list_stack[-1]
                current["count"] += 1
                bullet = f"{current['count']}." if current["ordered"] else "•"
                self.fragments.append(f"<font color='#0b4f9e'><b>{bullet}</b></font> ")
                self.style = self.styles["MarkdownListaSIAA"]
        elif tag == "br":
            self.fragments.append("<br/>")
        elif tag == "hr":
            self._flush()
            self.flowables.append(Paragraph("────────────────────────", self.styles["MarkdownReguaSIAA"]))
        elif tag == "code":
            self.fragments.append('<font name="Courier" backColor="#e2e8f0">')
            self.inline_tags.append("font")
        elif tag == "a":
            href = attrs.get("href", "")
            scheme = urlparse(href).scheme.lower()
            if scheme in {"http", "https", "mailto"}:
                self.fragments.append(f'<link href="{html.escape(href, quote=True)}" color="#0b4f9e">')
                self.inline_tags.append("link")
        elif tag == "img":
            alt = attrs.get("alt", "")
            if alt:
                self.fragments.append(html.escape(alt))
        elif tag in self.INLINE_TAGS:
            inline = self.INLINE_TAGS[tag]
            self.fragments.append(f"<{inline}>")
            self.inline_tags.append(inline)
        elif tag == "tr":
            self._flush()

    def handle_endtag(self, tag):
        if self.ignored_tags:
            if tag == self.ignored_tags[-1]:
                self.ignored_tags.pop()
            return
        if tag in self.BLOCK_TAGS:
            self._flush()
            self.style = self.styles["MarkdownCorpoSIAA"]
        elif tag in {"ul", "ol"}:
            self._flush()
            if self.list_stack:
                self.list_stack.pop()
        elif tag == "a" and self.inline_tags and self.inline_tags[-1] == "link":
            self.fragments.append("</link>")
            self.inline_tags.pop()
        elif tag == "code" and self.inline_tags and self.inline_tags[-1] == "font":
            self.fragments.append("</font>")
            self.inline_tags.pop()
        elif tag in self.INLINE_TAGS:
            inline = self.INLINE_TAGS[tag]
            if inline in self.inline_tags:
                self.fragments.append(f"</{inline}>")
                self.inline_tags.remove(inline)
        elif tag == "td":
            self.fragments.append(" &nbsp; | &nbsp;")
        elif tag == "tr":
            self._flush()

    def handle_data(self, data):
        if not self.ignored_tags:
            self.fragments.append(html.escape(data))


def _comentario_markdown_flowables(conteudo, styles):
    if not conteudo:
        conteudo = "Nenhum comentário informado."
    html_markdown = markdown.markdown(
        conteudo,
        extensions=["extra", "sane_lists"],
        output_format="xhtml",
    )
    parser = _MarkdownFlowableParser(styles)
    parser.feed(html_markdown)
    parser.close()
    parser._flush()
    return parser.flowables


def formatar_nota(nota):
    """'8.50' -> '8,5'; None -> None (vistos antigos não têm nota)."""
    if nota in (None, ""):
        return None
    texto = f"{float(nota):.2f}".rstrip("0").rstrip(".")
    return texto.replace(".", ",")


def _enunciados_numerados(texto):
    marcadores = list(re.finditer(
        r"(?im)^[ \t]*(?:quest(?:ão|ao)\s*)?(\d{1,3})\s*[.)\-:]\s+(?=\S)",
        texto,
    ))
    enunciados = []
    for indice, marcador in enumerate(marcadores):
        numero = int(marcador.group(1))
        if numero > 100:
            continue
        inicio = marcador.end()
        fim = marcadores[indice + 1].start() if indice + 1 < len(marcadores) else len(texto)
        corpo = texto[inicio:fim]
        linhas = [
            re.sub(r"_+", " ", linha).strip()
            for linha in corpo.splitlines()
            if linha.strip() and not re.fullmatch(r"[\s_]+", linha)
        ]
        corpo = re.sub(r"\s+", " ", " ".join(linhas)).strip()
        if corpo:
            enunciados.append(corpo[:5000])
        if len(enunciados) >= 100:
            break
    return enunciados


def _questoes_numeradas(texto):
    marcadores = list(re.finditer(
        r"(?im)^[ \t]*(?:quest(?:ão|ao)\s*)?(\d{1,3})\s*[.)\-:]\s+(?=\S)",
        texto,
    ))

    # Detectar tópicos (Situação A, Tópico 1, Caso 1, etc. ou bullet points)
    marcador_topico = re.compile(
        r"(?im)^[ \t]*(?:situação|tópico|caso|parte|seção|case|section)\s*([A-Za-z0-9]+)\s*[:\-]?\s*(?=\S)",
        re.IGNORECASE,
    )
    marcador_bullet = re.compile(
        r"(?im)^[ \t]*[●•○●]\s*(.+?)\s*$",
    )
    topicos_encontrados = list(marcador_topico.finditer(texto))
    bullets_encontrados = list(marcador_bullet.finditer(texto))

    # Extrair texto introdutório antes da primeira questão (apenas instruções úteis)
    texto_introdutorio = ""
    if marcadores:
        primeiro_questao = marcadores[0].start()
        texto_antes = texto[:primeiro_questao]
        linhas_antes = [
            re.sub(r"_+", " ", linha).strip()
            for linha in texto_antes.splitlines()
            if linha.strip() and not re.fullmatch(r"[\s_]+", linha)
        ]
        # Filtrar linhas de cabeçalho (nomes de campos, disciplinas, etc.)
        linhas_filtradas = []
        palavras_chave_cabecalho = [
            "turma", "aluno", "professor", "disciplina", "ensino médio",
            "recuperação", "trimestre", "siaa", "seduc", "ano"
        ]
        for linha in linhas_antes:
            # Ignorar linhas que parecem ser campos de formulário ou cabeçalho
            if any(palavra.lower() in linha.lower() for palavra in palavras_chave_cabecalho):
                continue
            # Ignorar linhas muito curtas (provavelmente campos)
            if len(linha) < 20:
                continue
            # Ignorar linhas com muitos underscores
            if linha.count("_") > 3:
                continue
            linhas_filtradas.append(linha)

        if linhas_filtradas:
            texto_introdutorio = " ".join(linhas_filtradas)
            # Limpar espaços excessivos
            texto_introdutorio = re.sub(r"\s+", " ", texto_introdutorio).strip()

    questoes = []
    marcador_alternativa = re.compile(
        r"(?<!\w)(?:\(([A-J])\)|([A-J])\s*[).:\-])\s+",
        re.IGNORECASE,
    )
    marcador_subquestao = re.compile(
        r"(?im)^[ \t]*([a-z])\s*[).:\-]\s+(?=\S)",
    )

    # Determinar o tópico de cada questão
    topico_atual = None
    for indice, marcador in enumerate(marcadores):
        # Verificar se há um tópico ou bullet antes desta questão
        posicao_questao = marcador.start()

        # Verificar bullets primeiro (têm prioridade)
        for bullet in bullets_encontrados:
            if bullet.start() < posicao_questao and (topico_atual is None or bullet.start() > topico_atual["posicao"]):
                topico_atual = {
                    "nome": bullet.group(1).strip(),
                    "tipo": "bullet",
                    "posicao": bullet.start(),
                }

        # Verificar tópicos textuais (caso não tenha bullet)
        for topico in topicos_encontrados:
            if topico.start() < posicao_questao and (topico_atual is None or topico.start() > topico_atual["posicao"]):
                topico_atual = {
                    "nome": topico.group(0).strip(),
                    "identificador": topico.group(1),
                    "tipo": "texto",
                    "posicao": topico.start(),
                }

        numero = int(marcador.group(1))
        if numero > 100:
            continue
        inicio = marcador.end()
        fim = marcadores[indice + 1].start() if indice + 1 < len(marcadores) else len(texto)
        linhas = [
            re.sub(r"_+", " ", linha).strip()
            for linha in texto[inicio:fim].splitlines()
            if linha.strip() and not re.fullmatch(r"[\s_]+", linha)
        ]
        # Garantir que linhas seja sempre uma lista
        if not isinstance(linhas, list):
            linhas = []
        enunciado = []
        alternativas = []
        alternativa_atual = None
        subquestoes = []
        subquestao_atual = None
        topico_questao = None

        # Detectar se a primeira linha é um título/tópico da questão
        if linhas and len(linhas) > 0:
            primeira_linha = linhas[0]
            # Padrões de título: linhas em MAIÚSCULAS, com mais de 5 palavras, ou com palavras como DESAFIO, QUESTÃO, etc.
            if (primeira_linha.isupper() and len(primeira_linha.split()) >= 3) or \
               re.search(r"(?:DESAFIO|QUESTÃO|PROVA|ATIVIDADE|TESTE|EXERCÍCIO)", primeira_linha, re.IGNORECASE):
                topico_questao = primeira_linha
                linhas = linhas[1:] if len(linhas) > 1 else []  # Remover a primeira linha das linhas a processar

        for linha in linhas:
            # Verificar se é um bullet (tópico dentro da questão)
            match_bullet = marcador_bullet.match(linha)
            if match_bullet:
                texto_bullet = match_bullet.group(1).strip()
                # Adicionar bullet ao enunciado como parte do contexto
                enunciado.append(f"● {texto_bullet}")
                continue

            # Verificar se é uma subquestão (a, b, c, etc.)
            match_sub = marcador_subquestao.match(linha)
            if match_sub and not linha.startswith(tuple("ABCDEFGHIJ")):
                # Salvar subquestão anterior se existir
                if subquestao_atual:
                    subquestoes.append(subquestao_atual)
                # Criar nova subquestão
                letra = match_sub.group(1).lower()
                texto_sub = linha[match_sub.end():].strip()
                subquestao_atual = {
                    "letra": letra,
                    "enunciado": texto_sub,
                    "tipo": "SUBJETIVA",
                    "alternativas": [],
                }
                continue

            # Se estiver em uma subquestão, adicionar linha ao enunciado
            if subquestao_atual:
                # Verificar se é alternativa da subquestão
                marcadores_alt = list(marcador_alternativa.finditer(linha))
                if marcadores_alt:
                    for indice_alt, marcador_alt in enumerate(marcadores_alt):
                        fim_alt = (
                            marcadores_alt[indice_alt + 1].start()
                            if indice_alt + 1 < len(marcadores_alt)
                            else len(linha)
                        )
                        texto_alt = linha[marcador_alt.end():fim_alt].strip()
                        letra = marcador_alt.group(1) or marcador_alt.group(2)
                        subquestao_atual["alternativas"].append({
                            "letra": letra.upper(),
                            "texto": texto_alt,
                        })
                        subquestao_atual["tipo"] = "OBJETIVA"
                else:
                    subquestao_atual["enunciado"] = f"{subquestao_atual['enunciado']} {linha}".strip()
                continue

            # Processamento normal da questão principal
            marcadores_alt = list(marcador_alternativa.finditer(linha))
            prefixo_linha = linha[:marcadores_alt[0].start()].strip() if marcadores_alt else ""
            parece_alternativa = bool(
                marcadores_alt
                and (
                    len(marcadores_alt) > 1
                    or not prefixo_linha
                    or prefixo_linha.endswith(("?", ":"))
                )
            )
            if parece_alternativa:
                prefixo = prefixo_linha
                if prefixo:
                    enunciado.append(prefixo)
                for indice_alt, marcador_alt in enumerate(marcadores_alt):
                    fim_alt = (
                        marcadores_alt[indice_alt + 1].start()
                        if indice_alt + 1 < len(marcadores_alt)
                        else len(linha)
                    )
                    texto_alt = linha[marcador_alt.end():fim_alt].strip()
                    letra = marcador_alt.group(1) or marcador_alt.group(2)
                    alternativa_atual = {
                        "letra": letra.upper(),
                        "texto": texto_alt,
                    }
                    alternativas.append(alternativa_atual)
            elif alternativa_atual:
                alternativa_atual["texto"] = (
                    f"{alternativa_atual['texto']} {linha}".strip()
                )
            else:
                enunciado.append(linha)

        # Salvar última subquestão se existir
        if subquestao_atual:
            subquestoes.append(subquestao_atual)

        if len(alternativas) < 2 and not subquestoes:
            enunciado = linhas
            alternativas = []
        enunciado_texto = re.sub(r"\s+", " ", " ".join(enunciado)).strip()
        if not enunciado_texto:
            continue
        numero_questao = len(questoes) + 1
        questao = {
            "id": f"pdf-{numero_questao}",
            "ordem": numero_questao,
            "enunciado": enunciado_texto[:5000],
            "tipo": "OBJETIVA" if alternativas else "SUBJETIVA",
            "alternativas": [
                {"letra": item["letra"], "texto": item["texto"][:1000]}
                for item in alternativas
            ],
            "subquestoes": subquestoes if subquestoes else [],
            "topico": topico_questao or (topico_atual["nome"] if topico_atual else None),
        }
        questoes.append(questao)
        if len(questoes) >= 100:
            break
    # Organizar questões por tópicos
    topicos_organizados = {}
    for questao in questoes:
        topico = questao.get("topico") or "Sem tópico"
        if topico not in topicos_organizados:
            topicos_organizados[topico] = []
        topicos_organizados[topico].append(questao)

    return {
        "texto_introdutorio": texto_introdutorio,
        "questoes": questoes,
        "topicos": topicos_organizados,
    }


def _extrair_questoes_arquivo(conteudo, arquivo_nome):
    if os.path.splitext(arquivo_nome)[1].lower() != ".pdf":
        return []
    leitor = PdfReader(BytesIO(conteudo), strict=False)
    texto = "\n".join(
        pagina.extract_text(extraction_mode="layout") or ""
        for pagina in leitor.pages[:200]
    )
    return _questoes_numeradas(texto)


def _extrair_enunciados_arquivo(conteudo, arquivo_nome):
    extensao = os.path.splitext(arquivo_nome)[1].lower()
    texto = ""
    if conteudo.startswith(b"%PDF-") or extensao == ".pdf":
        leitor = PdfReader(BytesIO(conteudo), strict=False)
        texto = "\n".join(
            pagina.extract_text(extraction_mode="layout") or ""
            for pagina in leitor.pages[:200]
        )
    elif extensao in {".docx", ".odt"}:
        documento_xml = "word/document.xml" if extensao == ".docx" else "content.xml"
        try:
            with zipfile.ZipFile(BytesIO(conteudo)) as arquivo_zip:
                raiz = ElementTree.fromstring(arquivo_zip.read(documento_xml))
        except (KeyError, zipfile.BadZipFile, ElementTree.ParseError):
            return []
        texto = "\n".join(
            " ".join(elemento.text or "" for elemento in paragrafo.iter())
            for paragrafo in raiz.iter()
            if paragrafo.tag.endswith("}p")
        )
    elif extensao in {".txt", ".md", ".csv"} or mimetypes.guess_type(arquivo_nome)[0] == "text/plain":
        try:
            texto = conteudo.decode("utf-8-sig")
        except UnicodeDecodeError:
            texto = conteudo.decode("cp1252", errors="replace")
    else:
        return []

    return _enunciados_numerados(texto)


def _gerar_pdf_resumo(dados, parecer, assinatura, url_verificacao):
    buffer = BytesIO()
    assinado_em = timezone.localtime(datetime.fromisoformat(dados["assinado_em"]))
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="SecaoSIAA",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#16345c"),
        backColor=colors.HexColor("#edf4fb"),
        borderColor=colors.HexColor("#c7d9ee"),
        borderWidth=0.5,
        borderPadding=(5, 7, 5),
        spaceBefore=8,
        spaceAfter=5,
    ))
    styles.add(ParagraphStyle(
        name="CorpoSIAA",
        parent=styles["BodyText"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#26364a"),
        backColor=colors.HexColor("#f8fafc"),
        borderColor=colors.HexColor("#e2e8f0"),
        borderWidth=0.5,
        borderPadding=8,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="MarkdownCorpoSIAA",
        parent=styles["BodyText"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#26364a"),
        leftIndent=5,
        rightIndent=5,
        spaceBefore=1,
        spaceAfter=5,
        allowWidows=0,
        allowOrphans=0,
    ))
    for nivel in range(1, 7):
        styles.add(ParagraphStyle(
            name=f"MarkdownH{nivel}SIAA",
            parent=styles["Heading1" if nivel < 3 else "Heading2"],
            fontName="Helvetica-Bold",
            fontSize=max(10, 16 - (nivel * 1.2)),
            leading=max(13, 19 - nivel),
            textColor=colors.HexColor("#16345c"),
            spaceBefore=6,
            spaceAfter=4,
        ))
    styles.add(ParagraphStyle(
        name="MarkdownBlockquoteSIAA",
        parent=styles["MarkdownCorpoSIAA"],
        leftIndent=12,
        borderColor=colors.HexColor("#38bdf8"),
        borderWidth=2,
        borderPadding=6,
        backColor=colors.HexColor("#f1f5f9"),
        textColor=colors.HexColor("#475569"),
    ))
    styles.add(ParagraphStyle(
        name="MarkdownPreSIAA",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=7.5,
        leading=10,
        backColor=colors.HexColor("#f1f5f9"),
        borderColor=colors.HexColor("#e2e8f0"),
        borderWidth=0.5,
        borderPadding=6,
        spaceAfter=5,
        wordWrap="CJK",
    ))
    styles.add(ParagraphStyle(
        name="MarkdownListaSIAA",
        parent=styles["MarkdownCorpoSIAA"],
        leftIndent=18,
        firstLineIndent=-12,
        spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        name="MarkdownReguaSIAA",
        parent=styles["Normal"],
        fontSize=7,
        leading=10,
        textColor=colors.HexColor("#cbd5e1"),
        spaceBefore=3,
        spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name="MetadadosSIAA",
        parent=styles["Normal"],
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155"),
        backColor=colors.HexColor("#f1f5f9"),
        borderColor=colors.HexColor("#e2e8f0"),
        borderWidth=0.5,
        borderPadding=(6, 8, 6),
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="ValidacaoSIAA",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=6.5,
        leading=9,
        textColor=colors.HexColor("#475569"),
        backColor=colors.HexColor("#f1f5f9"),
        borderColor=colors.HexColor("#cbd5e1"),
        borderWidth=0.5,
        borderPadding=7,
        wordWrap="CJK",
    ))

    story = [
        Paragraph(
            f"<font color='#16345c'><b>ATIVIDADE</b></font>  {_texto_pdf(dados['atividade'])}"
            f" &nbsp;&nbsp; <font color='#16345c'><b>TURMA</b></font>  {_texto_pdf(dados['turma'])}"
            f" &nbsp;&nbsp; <font color='#16345c'><b>DISCIPLINA</b></font>  {_texto_pdf(dados['disciplina'])}",
            styles["MetadadosSIAA"],
        ),
        Paragraph(
            f"<font color='#16345c'><b>ALUNO</b></font>  {_texto_pdf(dados['aluno'])}"
            f" &nbsp;&nbsp; <font color='#16345c'><b>PROFESSOR</b></font>  {_texto_pdf(dados['professor'])}",
            styles["MetadadosSIAA"],
        ),
        Paragraph(
            f"<font color='#16345c'><b>ENVIADO EM</b></font>  {_texto_pdf(dados['enviado_em'])}"
            f" &nbsp;&nbsp; <font color='#16345c'><b>ARQUIVO</b></font>  {_texto_pdf(dados['arquivo_nome'])}",
            styles["MetadadosSIAA"],
        ),
    ]
    nota_txt = formatar_nota(dados.get("nota"))
    if nota_txt is not None:
        story.append(Paragraph(
            f"<font color='#16345c'><b>NOTA</b></font>  <b>{nota_txt}</b> / 10",
            styles["MetadadosSIAA"],
        ))
    if dados["descricao"]:
        story.extend([
            Paragraph("DESCRIÇÃO DA ATIVIDADE", styles["SecaoSIAA"]),
            Paragraph(_texto_pdf(dados["descricao"]), styles["CorpoSIAA"]),
        ])
    story.extend([
        Paragraph("COMENTÁRIO DO ALUNO", styles["SecaoSIAA"]),
        *_comentario_markdown_flowables(dados["comentario_aluno"], styles),
        Paragraph("PARECER DO PROFESSOR", styles["SecaoSIAA"]),
        Paragraph(_texto_pdf(parecer) or "Sem observações adicionais.", styles["CorpoSIAA"]),
        Spacer(1, 8),
        Paragraph(
            f"<font color='#16345c'><b>DOCUMENTO AUTENTICADO · HMAC-SHA256</b></font><br/>"
            f"Assinatura: {assinatura}<br/>"
            f"Arquivo SHA-256: {dados['arquivo_sha256']}<br/>"
            f"Verificação: {_texto_pdf(url_verificacao)}",
            styles["ValidacaoSIAA"],
        ),
    ])

    def desenhar_cabecalho(pdf, _document):
        largura, altura = A4
        pdf.saveState()
        azul = colors.HexColor("#16345c")
        azul_claro = colors.HexColor("#38bdf8")
        pdf.setFillColor(azul)
        pdf.rect(0, altura - 94, largura, 94, fill=1, stroke=0)
        pdf.setFillColor(azul_claro)
        pdf.rect(0, altura - 94, 6, 94, fill=1, stroke=0)
        pdf.setFillColor(colors.HexColor("#bfdbfe"))
        pdf.setFont("Helvetica-Bold", 7)
        pdf.drawString(42, altura - 31, "SIAA-SEDUC  /  ACOMPANHAMENTO ACADÊMICO")
        pdf.setFillColor(colors.HexColor("#16345c"))
        pdf.setFillColor(colors.white)
        pdf.setFont("Helvetica-Bold", 17)
        pdf.drawString(42, altura - 55, "Registro de atividade")
        pdf.setFillColor(colors.HexColor("#dbeafe"))
        pdf.setFont("Helvetica", 8)
        pdf.drawString(42, altura - 71, "COMPROVANTE DE ENVIO E CORREÇÃO")

        pdf.saveState()
        pdf.translate(largura - 94, altura - 49)
        pdf.rotate(-9)
        vermelho = colors.HexColor("#b42318")
        pdf.setStrokeColor(vermelho)
        pdf.setFillColor(vermelho)
        pdf.setLineWidth(1.8)
        pdf.roundRect(-45, -21, 90, 42, 5, fill=0, stroke=1)
        pdf.setLineWidth(0.5)
        pdf.roundRect(-41, -17, 82, 34, 3, fill=0, stroke=1)
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawCentredString(0, 3, "VISTO")
        pdf.setFont("Helvetica-Bold", 6)
        pdf.drawCentredString(0, -9, "SIAA-SEDUC")
        pdf.setFont("Helvetica", 5)
        data_carimbo = assinado_em.strftime("%d/%m/%Y")
        if nota_txt is not None:
            data_carimbo = f"{data_carimbo}  ·  NOTA {nota_txt}"
        pdf.drawCentredString(
            0,
            -16,
            data_carimbo,
        )
        pdf.restoreState()
        pdf.setFillColor(colors.HexColor("#eaf2f8"))
        pdf.rect(0, altura - 100, largura, 6, fill=1, stroke=0)
        pdf.restoreState()

    SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=48,
        leftMargin=48,
        topMargin=116,
        bottomMargin=48,
        title=f"Visto - {dados['atividade']}",
        author="SIAA-SEDUC",
    ).build(story, onFirstPage=desenhar_cabecalho, onLaterPages=desenhar_cabecalho)
    return buffer.getvalue()


def _gerar_pdf_imagens(conteudo):
    entrada = BytesIO(conteudo)
    saida = BytesIO()
    pdf = canvas.Canvas(saida, pagesize=A4)
    largura_pagina, altura_pagina = A4

    with Image.open(entrada) as imagem:
        for quadro in ImageSequence.Iterator(imagem):
            quadro_rgb = quadro.copy().convert("RGB")
            quadro_rgb.thumbnail((1600, 2200), Image.Resampling.LANCZOS)
            imagem_comprimida = BytesIO()
            quadro_rgb.save(
                imagem_comprimida,
                format="JPEG",
                quality=72,
                optimize=True,
            )
            imagem_comprimida.seek(0)
            largura, altura = quadro_rgb.size
            escala = min(
                (largura_pagina - 72) / largura,
                (altura_pagina - 72) / altura,
            )
            largura_final = largura * escala
            altura_final = altura * escala
            x = (largura_pagina - largura_final) / 2
            y = (altura_pagina - altura_final) / 2
            pdf.drawImage(
                ImageReader(imagem_comprimida),
                x,
                y,
                width=largura_final,
                height=altura_final,
                preserveAspectRatio=True,
            )
            pdf.showPage()
    pdf.save()
    return saida.getvalue()


def _gerar_pdf_texto(conteudo, arquivo_nome):
    try:
        texto = conteudo.decode("utf-8-sig")
    except UnicodeDecodeError:
        texto = conteudo.decode("cp1252", errors="replace")
    texto = "".join(
        caractere
        for caractere in texto
        if caractere in "\n\t" or ord(caractere) >= 32 and not 127 <= ord(caractere) <= 159
    )
    texto = texto.replace("\r\n", "\n").replace("\r", "\n").replace("\t", "    ")
    texto = texto.encode("cp1252", errors="replace").decode("cp1252")

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="ArquivoTextoTituloSIAA",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#16345c"),
        spaceAfter=12,
    ))
    styles.add(ParagraphStyle(
        name="ArquivoTextoCorpoSIAA",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1e293b"),
        splitLongWords=True,
        wordWrap="CJK",
    ))

    corpo = html.escape(texto).replace("\n", "<br/>") or " "
    saida = BytesIO()
    SimpleDocTemplate(
        saida,
        pagesize=A4,
        rightMargin=48,
        leftMargin=48,
        topMargin=48,
        bottomMargin=48,
        title=f"Conteúdo - {arquivo_nome}",
    ).build([
        Paragraph("Correção da atividade", styles["ArquivoTextoTituloSIAA"]),
        Paragraph(corpo, styles["ArquivoTextoCorpoSIAA"]),
    ])
    return saida.getvalue()


class _MarcaCerto(Flowable):
    def __init__(self):
        super().__init__()
        self.width = 10
        self.height = 10

    def wrap(self, _largura, _altura):
        return self.width, self.height

    def draw(self):
        self.canv.setStrokeColor(colors.HexColor("#15803d"))
        self.canv.setLineWidth(1.8)
        caminho = self.canv.beginPath()
        caminho.moveTo(1, 5)
        caminho.lineTo(4, 2)
        caminho.lineTo(9, 9)
        self.canv.drawPath(caminho)


def _gerar_pdf_correcao(correcao):
    questoes = correcao.get("questoes") or []
    respostas_livres = correcao.get("respostas_livres") or []
    enunciados_arquivo = correcao.get("enunciados_arquivo") or []
    correcoes_por_chave = {
        item.get("chave"): item
        for item in correcao.get("correcoes_questoes") or []
        if isinstance(item, dict) and isinstance(item.get("chave"), str)
    }
    correcoes_questoes = {
        item.get("chave"): item.get("parecer", "")
        for item in correcoes_por_chave.values()
        if isinstance(item.get("parecer"), str) and item["parecer"].strip()
    }
    questoes_pdf_objetivas = [
        (indice, resposta)
        for indice, resposta in enumerate(respostas_livres)
        if resposta.get("tipo") == "OBJETIVA"
        and isinstance(resposta.get("alternativas"), list)
    ]
    if not questoes and not respostas_livres and not correcoes_questoes and not enunciados_arquivo:
        return None

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="CorrecaoTituloSIAA",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=23,
        textColor=colors.HexColor("#16345c"),
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="CorrecaoSubtituloSIAA",
        parent=styles["BodyText"],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=14,
    ))
    styles.add(ParagraphStyle(
        name="CorrecaoPerguntaSIAA",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#172554"),
        spaceAfter=0,
    ))
    styles.add(ParagraphStyle(
        name="CorrecaoRespostaSIAA",
        parent=styles["BodyText"],
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155"),
    ))
    styles.add(ParagraphStyle(
        name="CorrecaoResumoSIAA",
        parent=styles["BodyText"],
        fontSize=8,
        leading=12,
        textColor=colors.HexColor("#334155"),
        alignment=TA_CENTER,
        spaceAfter=0,
    ))
    styles.add(ParagraphStyle(
        name="CorrecaoTipoSIAA",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#475569"),
    ))
    styles.add(ParagraphStyle(
        name="CorrecaoAlternativaSIAA",
        parent=styles["BodyText"],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#334155"),
    ))
    styles.add(ParagraphStyle(
        name="CorrecaoRotuloSIAA",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=6.5,
        leading=8,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name="CorrecaoCabecalhoSIAA",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
    ))
    saida = BytesIO()
    documento = SimpleDocTemplate(
        saida,
        pagesize=A4,
        rightMargin=48,
        leftMargin=48,
        topMargin=48,
        bottomMargin=48,
        title="Correção da atividade",
    )
    story = [
        Paragraph("Correção da atividade", styles["CorrecaoTituloSIAA"]),
        Paragraph(
            "RELATÓRIO DE RESPOSTAS E AVALIAÇÃO",
            styles["CorrecaoSubtituloSIAA"],
        ),
    ]
    objetivas = [q for q in questoes if q.get("tipo") == "OBJETIVA"]
    subjetivas = [q for q in questoes if q.get("tipo") == "SUBJETIVA"]
    acertos = sum(q.get("correta") is True for q in objetivas)
    discursivas_respondidas = sum(
        bool(str(q.get("resposta_aluno") or "").strip()) for q in subjetivas
    )
    indicadores = []
    if objetivas:
        indicadores.append((
            "Questões objetivas",
            f"{acertos} de {len(objetivas)} correta(s).",
        ))
    if subjetivas:
        indicadores.append((
            "Discursivas",
            f"{discursivas_respondidas} de {len(subjetivas)} respondida(s); "
            "sem avaliação individual registrada.",
        ))
    total_discursivas_pdf = sum(
        resposta.get("tipo") != "OBJETIVA" for resposta in respostas_livres
    )
    if total_discursivas_pdf:
        indicadores.append((
            "Questões discursivas do PDF",
            f"{total_discursivas_pdf} resposta(s); sem avaliação individual registrada.",
        ))
    if questoes_pdf_objetivas:
        acertos_pdf = sum(
            correcoes_por_chave.get(f"resposta_livre:{indice}", {}).get("correta") is True
            for indice, _ in questoes_pdf_objetivas
        )
        indicadores.append((
            "Questões objetivas do PDF",
            f"{acertos_pdf} de {len(questoes_pdf_objetivas)} correta(s).",
        ))
    if indicadores:
        largura_indicador = documento.width / len(indicadores)
        resumo = Table(
            [[
                Paragraph(
                    f"<b>{_texto_pdf(rotulo)}:</b> {_texto_pdf(valor)}",
                    styles["CorrecaoResumoSIAA"],
                )
                for rotulo, valor in indicadores
            ]],
            colWidths=[largura_indicador] * len(indicadores),
        )
        resumo.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dbe3ec")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.extend([resumo, Spacer(1, 14)])

    def adicionar_linha(texto, estilo, marca=False, recuo=0):
        estilo_linha = (
            ParagraphStyle(f"{estilo.name}Recuo{recuo}", parent=estilo, leftIndent=recuo)
            if recuo else estilo
        )
        conteudo = Paragraph(texto, estilo_linha)
        if marca:
            linha = Table([[_MarcaCerto(), conteudo]], colWidths=[16, documento.width - 16])
            linha.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]))
            story.append(linha)
        else:
            story.append(conteudo)

    def adicionar_card_questao(
        indice,
        enunciado,
        tipo,
        resultado,
        resposta_aluno,
        alternativas=None,
        alternativa_correta="",
        alternativa_marcada="",
        parecer="",
        pulada=False,
    ):
        story.append(Spacer(1, 7))
        paleta_status = {
            "Correta": ("#166534", "#dcfce7"),
            "Incorreta": ("#991b1b", "#fee2e2"),
            "Não respondida": ("#475569", "#e2e8f0"),
            "Avaliação individual não registrada": ("#854d0e", "#fef3c7"),
        }
        cor_status, fundo_status = paleta_status.get(
            resultado,
            ("#475569", "#e2e8f0"),
        )
        cabecalho = Table(
            [[Paragraph(f"QUESTÃO {indice:02d}", styles["CorrecaoCabecalhoSIAA"])]],
            colWidths=[documento.width],
        )
        cabecalho.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#16345c")),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]))
        story.append(cabecalho)
        metadados_questao = Table(
            [[Paragraph(
                f"<font color='{cor_status}'>Tipo: {_texto_pdf(tipo)}"
                f" &nbsp; · &nbsp; Resultado: {_texto_pdf(resultado)}</font>",
                styles["CorrecaoTipoSIAA"],
            )]],
            colWidths=[documento.width],
        )
        metadados_questao.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(fundo_status)),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(metadados_questao)

        enunciado_bloco = Table(
            [[Paragraph(
                f"<b>Questão {indice}:</b> {_texto_pdf(enunciado)}",
                styles["CorrecaoPerguntaSIAA"],
            )]],
            colWidths=[documento.width],
        )
        enunciado_bloco.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#dbe3ec")),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(enunciado_bloco)

        if alternativas:
            linhas_alternativas = [[
                Paragraph("ALTERNATIVA", styles["CorrecaoRotuloSIAA"]),
                Paragraph("MARCAÇÃO", styles["CorrecaoRotuloSIAA"]),
            ]]
            comandos_alternativas = [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef2f7")),
                ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LINEBELOW", (0, 1), (-1, -1), 0.35, colors.HexColor("#e2e8f0")),
            ]
            for indice_alternativa, alternativa in enumerate(alternativas, start=1):
                letra = alternativa.get("letra")
                correta = letra == alternativa_correta or alternativa.get("correta") is True
                marcada = letra == alternativa_marcada or alternativa.get("selecionada") is True
                marcacoes = []
                if correta:
                    marcacoes.append("gabarito")
                if marcada:
                    marcacoes.append("resposta do aluno")
                linhas_alternativas.append([
                    Paragraph(
                        f"<b>{_texto_pdf(letra)})</b> "
                        f"{_texto_pdf(alternativa.get('texto'))}",
                        styles["CorrecaoAlternativaSIAA"],
                    ),
                    Paragraph(
                        _texto_pdf(" · ".join(marcacoes) if marcacoes else "—"),
                        styles["CorrecaoAlternativaSIAA"],
                    ),
                ])
                if correta and marcada:
                    fundo = colors.HexColor("#dcfce7")
                elif correta:
                    fundo = colors.HexColor("#ecfdf5")
                elif marcada:
                    fundo = colors.HexColor("#eff6ff")
                else:
                    fundo = colors.white if indice_alternativa % 2 else colors.HexColor("#f8fafc")
                comandos_alternativas.append(
                    ("BACKGROUND", (0, indice_alternativa), (-1, indice_alternativa), fundo)
                )
            tabela_alternativas = Table(
                linhas_alternativas,
                colWidths=[
                    documento.width * 0.7,
                    documento.width * 0.3,
                ],
                repeatRows=1,
            )
            tabela_alternativas.setStyle(TableStyle(comandos_alternativas))
            story.extend([Spacer(1, 5), tabela_alternativas])

        texto_resposta = (
            "Questão pulada."
            if pulada
            else resposta_aluno or "Não respondida."
        )
        resposta_bloco = Table(
            [[Paragraph(
                f"<b>Resposta do aluno:</b> {_texto_pdf(texto_resposta)}",
                styles["CorrecaoRespostaSIAA"],
            )]],
            colWidths=[documento.width],
        )
        resposta_bloco.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
            ("LINEBEFORE", (0, 0), (0, -1), 3, colors.HexColor("#60a5fa")),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]))
        story.extend([Spacer(1, 6), resposta_bloco])
        if parecer:
            parecer_bloco = Table(
                [[Paragraph(
                    f"<b>Correção do professor:</b> {_texto_pdf(parecer)}",
                    styles["CorrecaoRespostaSIAA"],
                )]],
                colWidths=[documento.width],
            )
            parecer_bloco.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
                ("LINEBEFORE", (0, 0), (0, -1), 3, colors.HexColor("#4ade80")),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]))
            story.extend([Spacer(1, 5), parecer_bloco])

    for indice, questao in enumerate(questoes, start=1):
        resposta = questao.get("resposta_aluno") or "Não respondida."
        tipo_questao = questao.get("tipo")
        if tipo_questao == "OBJETIVA":
            resultado = (
                "Não respondida"
                if questao.get("pulado") or resposta == "Não respondida."
                else "Correta" if questao.get("correta") is True else "Incorreta"
            )
            tipo = "Objetiva"
        else:
            tipo = "Discursiva"
            resultado = "Não respondida" if resposta == "Não respondida." else (
                "Avaliação individual não registrada"
            )
        parecer_questao = correcoes_questoes.get(f"questao:{questao.get('id')}", "")
        adicionar_card_questao(
            indice=indice,
            enunciado=questao.get("enunciado"),
            tipo=tipo,
            resultado=resultado,
            resposta_aluno=resposta,
            alternativas=questao.get("alternativas") or [],
            parecer=parecer_questao,
            pulada=questao.get("pulado") is True,
        )

    for indice, resposta in enumerate(respostas_livres, start=len(questoes) + 1):
        indice_resposta = indice - len(questoes) - 1
        chave_resposta = f"resposta_livre:{indice_resposta}"
        correcao_resposta = correcoes_por_chave.get(chave_resposta, {})
        objetiva_pdf = (
            resposta.get("tipo") == "OBJETIVA"
            and isinstance(resposta.get("alternativas"), list)
        )
        if objetiva_pdf:
            correta = correcao_resposta.get("correta")
            resultado = (
                "Não respondida"
                if resposta.get("pulado")
                else "Correta" if correta is True else "Incorreta"
            )
            tipo_resposta = "Objetiva"
        else:
            resultado = (
                "Não respondida"
                if resposta.get("pulado")
                else "Avaliação individual não registrada"
            )
            tipo_resposta = "Discursiva"
        parecer_resposta = correcoes_questoes.get(chave_resposta, "")
        adicionar_card_questao(
            indice=indice,
            enunciado=resposta.get("enunciado") or resposta.get("questao"),
            tipo=tipo_resposta,
            resultado=resultado,
            resposta_aluno=resposta.get("resposta"),
            alternativas=resposta.get("alternativas") if objetiva_pdf else None,
            alternativa_correta=correcao_resposta.get("alternativa_correta", ""),
            alternativa_marcada=resposta.get("alternativa_marcada", ""),
            parecer=parecer_resposta,
            pulada=resposta.get("pulado") is True,
        )

    if enunciados_arquivo:
        story.append(Spacer(1, 12))
        adicionar_linha(
            "Enunciados identificados no arquivo da atividade"
            if correcao.get("origem_enunciados") == "atividade"
            else "Enunciados identificados no arquivo enviado",
            styles["CorrecaoTituloSIAA"],
        )
        for indice, enunciado in enumerate(enunciados_arquivo, start=1):
            adicionar_linha(
                f"<b>Questão {indice}:</b> {_texto_pdf(enunciado)}",
                styles["CorrecaoRespostaSIAA"],
            )
    elif correcao.get("arquivo") or correcao.get("arquivo_atividade"):
        story.append(Spacer(1, 8))
        adicionar_linha(
            "Não foi possível localizar enunciados numerados como texto no arquivo. "
            "PDFs digitalizados ou imagens podem exigir OCR; o arquivo original "
            "permanece incluído neste documento.",
            styles["CorrecaoTipoSIAA"],
        )

    if correcao.get("arquivo") and "arquivo" in correcoes_questoes:
        story.append(Spacer(1, 8))
        adicionar_linha(
            f"Arquivo enviado: {_texto_pdf(correcao['arquivo'])}",
            styles["CorrecaoPerguntaSIAA"],
        )
        adicionar_linha(
            f"<b>Correção do professor:</b> "
            f"{_texto_pdf(correcoes_questoes['arquivo']) or 'Sem observações.'}",
            styles["CorrecaoRespostaSIAA"],
            recuo=4,
        )

    if correcao.get("comentario_aluno") and "comentario" in correcoes_questoes:
        story.append(Spacer(1, 8))
        adicionar_linha("Comentário do aluno", styles["CorrecaoPerguntaSIAA"])
        adicionar_linha(
            f"<b>Resposta:</b> {_texto_pdf(correcao['comentario_aluno'])}",
            styles["CorrecaoRespostaSIAA"],
            recuo=4,
        )
        adicionar_linha(
            f"<b>Correção do professor:</b> "
            f"{_texto_pdf(correcoes_questoes['comentario']) or 'Sem observações.'}",
            styles["CorrecaoRespostaSIAA"],
            recuo=4,
        )

    documento.build(story)
    return saida.getvalue()


def _snapshot_correcao(envio):
    respostas = {
        resposta.questao_id: resposta
        for resposta in envio.respostas.select_related("alternativa").all()
    }
    questoes = []
    for questao in envio.atividade.questoes.prefetch_related("alternativas").all():
        resposta = respostas.get(questao.id)
        alternativas = []
        for alternativa in questao.alternativas.all():
            alternativas.append({
                "letra": alternativa.letra,
                "texto": alternativa.texto,
                "correta": alternativa.correta,
                "selecionada": bool(resposta and resposta.alternativa_id == alternativa.id),
            })

        resposta_aluno = ""
        correta = False
        if questao.tipo == "OBJETIVA":
            if resposta and resposta.alternativa:
                resposta_aluno = f"{resposta.alternativa.letra}) {resposta.alternativa.texto}"
                correta = resposta.alternativa.correta
        elif resposta:
            resposta_aluno = resposta.texto

        questoes.append({
            "id": questao.id,
            "enunciado": questao.enunciado,
            "tipo": questao.tipo,
            "alternativas": alternativas,
            "resposta_aluno": resposta_aluno,
            "correta": correta,
        })

    respostas_livres = envio.respostas_livres if isinstance(envio.respostas_livres, list) else []
    respostas_livres = [
        {
            "questao": str(item.get("questao") or ""),
            "resposta": str(item.get("resposta") or ""),
            **(
                {
                    "questao_id": str(item["questao_id"]),
                    "pulado": item.get("pulado") is True,
                }
                if item.get("questao_id")
                else {"pulado": item.get("pulado") is True}
            ),
            **(
                {"enunciado": str(item.get("enunciado") or ""), "tipo": item.get("tipo")}
                if item.get("tipo") in {"OBJETIVA", "SUBJETIVA"}
                else {}
            ),
            **(
                {
                    "alternativas": item.get("alternativas"),
                    "alternativa_marcada": item.get("alternativa_marcada"),
                }
                if item.get("tipo") == "OBJETIVA"
                and isinstance(item.get("alternativas"), list)
                else {}
            ),
        }
        for item in respostas_livres
        if isinstance(item, dict)
    ]
    return {
        "questoes": questoes,
        "respostas_livres": respostas_livres,
        "arquivo": os.path.basename(envio.arquivo.name) if envio.arquivo else None,
        "arquivo_atividade": (
            os.path.basename(envio.atividade.arquivo.name)
            if envio.atividade.arquivo else None
        ),
        "comentario_aluno": envio.comentario,
    }


def _montar_pdf_visto(conteudo_original, arquivo_nome, dados, assinatura, url_verificacao):
    resumo_pdf = PdfReader(BytesIO(_gerar_pdf_resumo(
        dados,
        dados["parecer_professor"],
        assinatura,
        url_verificacao.replace("__HASH__", assinatura),
    )))
    writer = PdfWriter()
    writer.append(resumo_pdf)

    if conteudo_original.startswith(b"%PDF-"):
        try:
            arquivo_pdf = PdfReader(BytesIO(conteudo_original), strict=False)
            if arquivo_pdf.is_encrypted:
                raise ValueError("O PDF enviado está protegido por senha e não pode ser incorporado.")
            for pagina in arquivo_pdf.pages:
                writer.add_page(pagina)
        except ValueError:
            raise
        except Exception as error:
            raise ValueError("Não foi possível ler o PDF enviado.") from error
    else:
        mime = mimetypes.guess_type(arquivo_nome)[0] or "application/octet-stream"
        respostas_na_plataforma = dados.get("respostas_na_plataforma")
        if respostas_na_plataforma is None:
            respostas_na_plataforma = (
                arquivo_nome == f"respostas_envio_{dados.get('envio_id')}.txt"
                and bool(
                    (dados.get("correcao") or {}).get("questoes")
                    or (dados.get("correcao") or {}).get("respostas_livres")
                )
            )
        if mime.startswith("text/") and not respostas_na_plataforma:
            pdf_texto = _gerar_pdf_texto(conteudo_original, arquivo_nome)
            for pagina in PdfReader(BytesIO(pdf_texto)).pages:
                writer.add_page(pagina)
            writer.add_attachment(arquivo_nome, conteudo_original)
        elif not respostas_na_plataforma:
            try:
                pdf_imagens = _gerar_pdf_imagens(conteudo_original)
                for pagina in PdfReader(BytesIO(pdf_imagens)).pages:
                    writer.add_page(pagina)
            except Exception:
                mime = mimetypes.guess_type(arquivo_nome)[0] or "application/octet-stream"
                story = BytesIO()
                texto = getSampleStyleSheet()["BodyText"]
                texto.alignment = TA_CENTER
                SimpleDocTemplate(story, pagesize=A4).build([
                    Spacer(1, 180),
                    Paragraph(
                        f"O arquivo <b>{_texto_pdf(arquivo_nome)}</b> "
                        f"(tipo {html.escape(mime)}) foi anexado a este PDF, "
                        "mas não pode ser visualizado como página.",
                        texto,
                    ),
                ])
                for pagina in PdfReader(story).pages:
                    writer.add_page(pagina)
                writer.add_attachment(arquivo_nome, conteudo_original)

    pdf_correcao = _gerar_pdf_correcao(dados.get("correcao") or {})
    if pdf_correcao:
        for pagina in PdfReader(BytesIO(pdf_correcao)).pages:
            writer.add_page(pagina)

    saida = BytesIO()
    writer.add_metadata({
        "/Title": f"Visto - {dados['atividade']}",
        "/Author": dados["professor"] or "SIAA-SEDUC",
        "/Subject": f"Atividade {dados['atividade_id']}; envio {dados['envio_id']}",
    })
    writer.write(saida)
    return saida.getvalue()



def _conteudo_original_do_envio(envio):
    """Bytes e nome do documento que o visto assina.

    Com arquivo, é o próprio arquivo do aluno. Sem arquivo (atividade respondida
    só com as questões da plataforma), é um texto gerado com as questões, as
    respostas e o comentário, em ordem fixa para que o SHA-256 seja reproduzível.
    """
    if envio.arquivo:
        with envio.arquivo.open("rb") as arquivo:
            return arquivo.read(), os.path.basename(envio.arquivo.name)

    respostas = {
        r.questao_id: r
        for r in envio.respostas.select_related("alternativa").all()
    }
    linhas = [f"Respostas do envio {envio.id} - {envio.atividade.titulo}", ""]
    questoes = list(envio.atividade.questoes.all())
    for numero, questao in enumerate(questoes, start=1):
        linhas.append(f"{numero}. {questao.enunciado}")
        resposta = respostas.get(questao.id)
        if questao.tipo == "OBJETIVA":
            alt = resposta.alternativa if resposta else None
            linhas.append(f"   Resposta: {alt.letra}) {alt.texto}" if alt else "   Resposta: (em branco)")
        else:
            linhas.append(f"   Resposta: {resposta.texto if resposta else '(em branco)'}")
        linhas.append("")
    respostas_livres = envio.respostas_livres if isinstance(envio.respostas_livres, list) else []
    for numero, resposta in enumerate(respostas_livres, start=len(questoes) + 1):
        if not isinstance(resposta, dict):
            continue
        linhas.append(f"{numero}. {resposta.get('questao') or ''}")
        linhas.append(f"   Resposta: {resposta.get('resposta') or '(em branco)'}")
        linhas.append("")
    if envio.comentario:
        linhas += ["Comentário do aluno:", envio.comentario, ""]
    if len(linhas) <= 2:
        raise ValueError("O envio não tem arquivo nem respostas para receber o visto.")
    return "\n".join(linhas).encode("utf-8"), f"respostas_envio_{envio.id}.txt"


def gerar_pdf_visto(
    envio,
    professor,
    parecer,
    chave,
    url_verificacao,
    nota=None,
    correcoes_questoes=None,
):
    conteudo_original, arquivo_nome = _conteudo_original_do_envio(envio)
    arquivo_sha256 = hashlib.sha256(conteudo_original).hexdigest()
    atividade = envio.atividade
    disciplina = atividade.disciplina.nome_disciplina if atividade.disciplina else ""
    momento = timezone.now()
    snapshot_correcao = _snapshot_correcao(envio)
    enunciados_arquivo = []
    origem_enunciados = ""
    if atividade.arquivo:
        with atividade.arquivo.open("rb") as arquivo_atividade:
            enunciados_arquivo = _extrair_enunciados_arquivo(
                arquivo_atividade.read(),
                os.path.basename(atividade.arquivo.name),
            )
        if enunciados_arquivo:
            origem_enunciados = "atividade"
    if not enunciados_arquivo and envio.arquivo:
        enunciados_arquivo = _extrair_enunciados_arquivo(conteudo_original, arquivo_nome)
        if enunciados_arquivo:
            origem_enunciados = "envio"
    snapshot_correcao["enunciados_arquivo"] = enunciados_arquivo
    snapshot_correcao["origem_enunciados"] = origem_enunciados
    dados = {
        "versao": 2,
        "envio_id": envio.id,
        "aluno_id": envio.aluno_id,
        "aluno": envio.aluno.nome_completo or "",
        "atividade_id": atividade.id,
        "atividade": atividade.titulo,
        "descricao": atividade.descricao,
        "turma": atividade.turma.turma or "",
        "disciplina": disciplina,
        "professor_id": professor.id,
        "professor": professor.nome_completo or "",
        "enviado_em": envio.enviado_em.isoformat(),
        "data_entrega": atividade.data_entrega.isoformat() if atividade.data_entrega else None,
        "arquivo_nome": arquivo_nome,
        "respostas_na_plataforma": not bool(envio.arquivo),
        "arquivo_sha256": arquivo_sha256,
        "comentario_aluno": envio.comentario,
        "parecer_professor": parecer,
        "correcao": {
            **snapshot_correcao,
            "correcoes_questoes": correcoes_questoes or [],
        },
        # nota entra nos dados assinados: alterá-la depois invalida o visto
        "nota": None if nota is None else f"{nota:.2f}",
        "assinado_em": momento.isoformat(),
    }
    assinatura = assinatura_hmac(dados, chave)
    url_verificacao = url_verificacao.replace("__HASH__", assinatura)
    return {
        "pdf": _montar_pdf_visto(conteudo_original, arquivo_nome, dados, assinatura, url_verificacao),
        "dados": dados,
        "assinatura": assinatura,
        "arquivo_sha256": arquivo_sha256,
        "assinado_em": momento,
    }


def regenerar_pdf_visto(envio, chave, url_verificacao):
    dados = envio.visto_dados
    assinatura = envio.visto_assinatura
    if not envio.visto_emitido_em or not isinstance(dados, dict) or not assinatura:
        raise ValueError("O envio não possui um visto assinado válido.")

    assinatura_esperada = assinatura_hmac(dados, chave)
    if not hmac.compare_digest(assinatura, assinatura_esperada):
        raise ValueError("A assinatura do visto não confere com os dados registrados.")

    conteudo_original, _ = _conteudo_original_do_envio(envio)
    arquivo_sha256 = hashlib.sha256(conteudo_original).hexdigest()
    if not hmac.compare_digest(arquivo_sha256, dados.get("arquivo_sha256", "")):
        raise ValueError("O arquivo original mudou desde a emissão do visto.")

    return _montar_pdf_visto(
        conteudo_original,
        dados["arquivo_nome"],
        dados,
        assinatura,
        url_verificacao,
    )
