import hashlib
import hmac
import html
import json
import mimetypes
import os
from html.parser import HTMLParser
from io import BytesIO
from datetime import datetime
from urllib.parse import urlparse

import markdown
from PIL import Image, ImageSequence
from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
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
    if not questoes and not respostas_livres:
        return None

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="CorrecaoTituloSIAA",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#16345c"),
        spaceAfter=14,
    ))
    styles.add(ParagraphStyle(
        name="CorrecaoPerguntaSIAA",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#172554"),
        spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name="CorrecaoRespostaSIAA",
        parent=styles["BodyText"],
        fontSize=9,
        leading=13,
        leftIndent=4,
    ))
    styles.add(ParagraphStyle(
        name="CorrecaoResumoSIAA",
        parent=styles["BodyText"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
        backColor=colors.HexColor("#f1f5f9"),
        borderColor=colors.HexColor("#cbd5e1"),
        borderWidth=0.5,
        borderPadding=8,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="CorrecaoTipoSIAA",
        parent=styles["BodyText"],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#475569"),
        leftIndent=4,
        spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name="CorrecaoAlternativaSIAA",
        parent=styles["BodyText"],
        fontSize=9,
        leading=12,
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
    story = [Paragraph("Correção da atividade", styles["CorrecaoTituloSIAA"])]
    objetivas = [q for q in questoes if q.get("tipo") == "OBJETIVA"]
    subjetivas = [q for q in questoes if q.get("tipo") == "SUBJETIVA"]
    acertos = sum(q.get("correta") is True for q in objetivas)
    discursivas_respondidas = sum(
        bool(str(q.get("resposta_aluno") or "").strip()) for q in subjetivas
    )
    if questoes:
        linhas_resumo = []
        if objetivas:
            linhas_resumo.append(
                f"<b>Questões objetivas:</b> {acertos} de {len(objetivas)} correta(s)."
            )
        if subjetivas:
            linhas_resumo.append(
                f"<b>Discursivas:</b> {discursivas_respondidas} de {len(subjetivas)} "
                "respondida(s); sem avaliação individual registrada."
            )
        story.append(Paragraph(
            "<br/>".join(linhas_resumo),
            styles["CorrecaoResumoSIAA"],
        ))
    if respostas_livres:
        story.append(Paragraph(
            f"<b>Questões discursivas:</b> {len(respostas_livres)} resposta(s); "
            "sem avaliação individual registrada.",
            styles["CorrecaoResumoSIAA"],
        ))

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

    for indice, questao in enumerate(questoes, start=1):
        story.append(Spacer(1, 8))
        resposta = questao.get("resposta_aluno") or "Não respondida."
        tipo_questao = questao.get("tipo")
        if tipo_questao == "OBJETIVA":
            resultado = "Correta" if questao.get("correta") is True else (
                "Não respondida" if resposta == "Não respondida." else "Incorreta"
            )
            tipo = "Objetiva"
        else:
            tipo = "Discursiva"
            resultado = "Não respondida" if resposta == "Não respondida." else (
                "Avaliação individual não registrada"
            )
        adicionar_linha(
            f"Questão {indice}: {_texto_pdf(questao.get('enunciado'))}",
            styles["CorrecaoPerguntaSIAA"],
            marca=tipo_questao == "OBJETIVA" and questao.get("correta") is True,
        )
        adicionar_linha(
            f"<b>Tipo:</b> {tipo} &nbsp; <b>Resultado:</b> {resultado}",
            styles["CorrecaoTipoSIAA"],
        )

        for alternativa in questao.get("alternativas") or []:
            resposta_aluno = alternativa.get("selecionada")
            marcadores = []
            if alternativa.get("correta") is True:
                marcadores.append("gabarito")
            if resposta_aluno:
                marcadores.append("resposta do aluno")
            sufixo = f" — {' · '.join(marcadores)}" if marcadores else ""
            texto_alternativa = (
                f"{_texto_pdf(alternativa.get('letra'))}) "
                f"{_texto_pdf(alternativa.get('texto'))}"
                f"{sufixo}"
            )
            adicionar_linha(
                texto_alternativa,
                styles["CorrecaoAlternativaSIAA"],
                marca=alternativa.get("correta") is True,
                recuo=12,
            )

        adicionar_linha(
            f"<b>Resposta do aluno:</b> {_texto_pdf(resposta)}",
            styles["CorrecaoRespostaSIAA"],
            recuo=4,
        )

    for indice, resposta in enumerate(respostas_livres, start=len(questoes) + 1):
        story.append(Spacer(1, 8))
        adicionar_linha(
            f"Questão {indice}: {_texto_pdf(resposta.get('questao'))}",
            styles["CorrecaoPerguntaSIAA"],
        )
        adicionar_linha(
            "<b>Tipo:</b> Discursiva &nbsp; "
            "<b>Resultado:</b> Avaliação individual não registrada",
            styles["CorrecaoTipoSIAA"],
        )
        adicionar_linha(
            f"<b>Resposta do aluno:</b> {_texto_pdf(resposta.get('resposta'))}",
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
            "enunciado": questao.enunciado,
            "tipo": questao.tipo,
            "alternativas": alternativas,
            "resposta_aluno": resposta_aluno,
            "correta": correta,
        })

    respostas_livres = envio.respostas_livres if isinstance(envio.respostas_livres, list) else []
    respostas_livres = [
        {"questao": str(item.get("questao") or ""), "resposta": str(item.get("resposta") or "")}
        for item in respostas_livres
        if isinstance(item, dict)
    ]
    return {"questoes": questoes, "respostas_livres": respostas_livres}


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


def gerar_pdf_visto(envio, professor, parecer, chave, url_verificacao, nota=None):
    conteudo_original, arquivo_nome = _conteudo_original_do_envio(envio)
    arquivo_sha256 = hashlib.sha256(conteudo_original).hexdigest()
    atividade = envio.atividade
    disciplina = atividade.disciplina.nome_disciplina if atividade.disciplina else ""
    momento = timezone.now()
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
        "correcao": _snapshot_correcao(envio),
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
