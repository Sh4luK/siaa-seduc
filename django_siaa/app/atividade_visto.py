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
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
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
    for numero, questao in enumerate(envio.atividade.questoes.all(), start=1):
        linhas.append(f"{numero}. {questao.enunciado}")
        resposta = respostas.get(questao.id)
        if questao.tipo == "OBJETIVA":
            alt = resposta.alternativa if resposta else None
            linhas.append(f"   Resposta: {alt.letra}) {alt.texto}" if alt else "   Resposta: (em branco)")
        else:
            linhas.append(f"   Resposta: {resposta.texto if resposta else '(em branco)'}")
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
        "versao": 1,
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
        "arquivo_sha256": arquivo_sha256,
        "comentario_aluno": envio.comentario,
        "parecer_professor": parecer,
        # nota entra nos dados assinados: alterá-la depois invalida o visto
        "nota": None if nota is None else f"{nota:.2f}",
        "assinado_em": momento.isoformat(),
    }
    assinatura = assinatura_hmac(dados, chave)
    url_verificacao = url_verificacao.replace("__HASH__", assinatura)

    resumo_pdf = PdfReader(BytesIO(_gerar_pdf_resumo(
        dados,
        parecer,
        assinatura,
        url_verificacao,
    )))
    writer = PdfWriter()
    writer.append(resumo_pdf)

    arquivo_pdf = None
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

    saida = BytesIO()
    writer.add_metadata({
        "/Title": f"Visto - {atividade.titulo}",
        "/Author": professor.nome_completo or "SIAA-SEDUC",
        "/Subject": f"Atividade {atividade.id}; envio {envio.id}",
    })
    writer.write(saida)
    return {
        "pdf": saida.getvalue(),
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
