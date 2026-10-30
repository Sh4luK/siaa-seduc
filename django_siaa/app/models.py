from django.db import models
from decimal import Decimal
from django.db import models
from datetime import date
from django.utils.text import slugify
import secrets
import re
import math

class Professor(models.Model):
    nome_completo = models.CharField(max_length=255, unique=True, null=True)
    data_cadastro = models.DateTimeField(auto_now_add=True, null=True)
    senha = models.CharField(max_length=150, null=True)
    ip = models.CharField(max_length=30, null=True)
    def __str__(self):
        return self.nome_completo

class Disciplina(models.Model):
    professores = models.ManyToManyField(Professor, related_name="disciplinas")
    nome_disciplina = models.CharField(max_length=255, null=True)

    def __str__(self):
        return self.nome_disciplina

class AtravessaPor(models.Model):
    professor = models.ForeignKey(Professor, on_delete=models.CASCADE, related_name="atravessamentos")
    escola = models.CharField(max_length=255, null=True)
    turma = models.CharField(max_length=255, null=True)
    etapa = models.CharField(max_length=255, null=True)
    disciplina_lecionada = models.TextField(blank=True, null=True, db_index=True)
    def __str__(self):
        return f"{self.professor.nome_completo} -> {self.turma}"

class Estudante(models.Model):
    posicao_ordem = models.IntegerField(null=True)
    nome_completo = models.CharField(max_length=255, null=True)
    escola = models.CharField(max_length=255, null=True)
    modo_de_ensino = models.CharField(max_length=255, null=True)
    serie = models.CharField(max_length=100, null=True)
    periodo = models.CharField(max_length=50, null=True)
    curso = models.CharField(max_length=255, null=True)
    turma = models.CharField(max_length=255, null=True)
    data_cadastro = models.DateTimeField(auto_now_add=True, null=True)
    senha = models.CharField(300, null=True, default="12345678")
    ip = models.CharField(max_length=150, null=True, default=None)
    def __str__(self):
        return f"{self.nome_completo} - {self.turma}"

class Nota(models.Model):
    RF_CHOICES = [
        ("CUR", "Cursando"),
        ("AP", "Aprovado"),
        ("RE", "Reprovado"),
        ("DE", "Desistente"),
        ("FA", "Falecido"),
        ("AB", "Abandono"),
        ("TR", "Transferido"),
        ("CA", "Cancelado"),
        ("TT", "Troca de Turma"),
        ("TO", "Transferido Outros"),
        ("PP", "Para Progressão"),
        ("ND", "Não Definido"),
    ]

    aluno = models.ForeignKey("app.Estudante", on_delete=models.CASCADE, related_name="notas")
    disciplina = models.ForeignKey("app.Disciplina", on_delete=models.CASCADE, related_name="notas")
    professor = models.ForeignKey("app.Professor", on_delete=models.CASCADE, related_name="notas_lancadas")
    turma = models.ForeignKey("app.AtravessaPor", on_delete=models.CASCADE, related_name="notas")
    ano_letivo = models.PositiveIntegerField(default=2026)

    # Trimestre 1
    nm1_t1 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    nm2_t1 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    nm3_t1 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    rpt_t1 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    mt_t1 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    mtf_t1 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)

    # Trimestre 2
    nm1_t2 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    nm2_t2 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    nm3_t2 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    rpt_t2 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    mt_t2 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    mtf_t2 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)

    # Trimestre 3
    nm1_t3 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    nm2_t3 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    nm3_t3 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    rpt_t3 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    mt_t3 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    mtf_t3 = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)

    # Resultado anual / final
    ma = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    pf = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    maf = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    rcf = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    tgf = models.PositiveIntegerField(default=0)
    rf = models.CharField(max_length=3, choices=RF_CHOICES, default="CUR")

    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        # Agora a unicidade considera também o professor, garantindo que as
        # notas fiquem isoladas por disciplina + turma + professor.
        unique_together = ("aluno", "disciplina", "turma", "professor", "ano_letivo")

    def _media(self, valores):
        validos = [v for v in valores if v is not None]
        if not validos:
            return None
        return round(sum(validos) / len(validos), 1)

    def calcular(self):
        for t in (1, 2, 3):
            notas = [getattr(self, f"nm{i}_t{t}") for i in (1, 2, 3)]
            # MT: média das três notas, antes da recuperação
            mt = self._media(notas)
            mtf = mt

            # MTF: a RPT substitui a NM3 quando a NM3 ou a MT ficam abaixo de 6.
            # A NM3 original continua gravada; a troca vale só para a MTF.
            nm3 = notas[2]
            rpt = getattr(self, f"rpt_t{t}")
            if rpt is not None and (
                (nm3 is not None and nm3 < Decimal("6"))
                or (mt is not None and mt < Decimal("6"))
            ):
                mtf = self._media([notas[0], notas[1], rpt])

            setattr(self, f"mt_t{t}", mt)
            setattr(self, f"mtf_t{t}", mtf)

        mtfs = [self.mtf_t1, self.mtf_t2, self.mtf_t3]
        self.ma = self._media(mtfs)

        if self.ma is None:
            self.maf = None
        elif self.pf is None:
            self.maf = self.ma
        else:
            self.maf = round((self.ma * 6 + self.pf * 4) / 10, 1)

    def save(self, *args, **kwargs):
        self.calcular()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.aluno} - {self.disciplina} - {self.professor} ({self.ano_letivo})"


class Aula(models.Model):
    disciplina = models.ForeignKey("app.Disciplina", on_delete=models.CASCADE, related_name="aulas")
    professor = models.ForeignKey("app.Professor", on_delete=models.CASCADE, related_name="aulas_ministradas")
    turma = models.ForeignKey("app.AtravessaPor", on_delete=models.CASCADE, related_name="aulas")
    ano_letivo = models.PositiveIntegerField(default=2026)

    data = models.DateField()
    assunto = models.TextField(blank=True, default="")
    estrategia_abordada = models.TextField(blank=True, default="")

    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("disciplina", "turma", "professor", "data")

    def __str__(self):
        return f"{self.turma} - {self.disciplina} - {self.data}"


class Frequencia(models.Model):
    aluno = models.ForeignKey("app.Estudante", on_delete=models.CASCADE, related_name="frequencias")
    disciplina = models.ForeignKey("app.Disciplina", on_delete=models.CASCADE, related_name="frequencias")
    professor = models.ForeignKey("app.Professor", on_delete=models.CASCADE, related_name="frequencias_registradas")
    turma = models.ForeignKey("app.AtravessaPor", on_delete=models.CASCADE, related_name="frequencias")
    ano_letivo = models.PositiveIntegerField(default=2026)

    data = models.DateField()
    presente = models.BooleanField(default=True)

    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("aluno", "disciplina", "turma", "professor", "data")

    def __str__(self):
        status = "Presente" if self.presente else "Falta"
        return f"{self.aluno} - {self.disciplina} - {self.data} - {status}"


class Evento(models.Model):
    professor = models.ForeignKey(
        "app.Professor", on_delete=models.CASCADE, related_name="eventos",
        null=True, blank=True
    )
    coordenador = models.ForeignKey(
        "app.Coordenador", on_delete=models.SET_NULL, related_name="eventos_criados",
        null=True, blank=True
    )
    turma = models.ForeignKey("app.AtravessaPor", on_delete=models.CASCADE, related_name="eventos", null=True, blank=True)
    ano_letivo = models.PositiveIntegerField(default=2026)

    titulo = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, default="")
    data = models.DateField()

    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["data"]

    def __str__(self):
        return f"{self.titulo} - {self.data}"

class Conteudo(models.Model):
    professor = models.ForeignKey("app.Professor", on_delete=models.CASCADE, related_name="conteudos")
    turma = models.ForeignKey("app.AtravessaPor", on_delete=models.CASCADE, related_name="conteudos")
    disciplina = models.ForeignKey("app.Disciplina", on_delete=models.CASCADE, related_name="conteudos")
    ano_letivo = models.PositiveIntegerField(default=2026)

    titulo = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, default="")
    data = models.DateField()
    arquivo = models.FileField(upload_to="conteudos/%Y/%m/", null=True, blank=True)

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-data"]

    def __str__(self):
        return f"{self.titulo} - {self.turma} - {self.data}"

class Atividade(models.Model):
    professor = models.ForeignKey("app.Professor", on_delete=models.CASCADE, related_name="atividades")
    turma = models.ForeignKey("app.AtravessaPor", on_delete=models.CASCADE, related_name="atividades")
    disciplina = models.ForeignKey("app.Disciplina", on_delete=models.CASCADE, related_name="atividades")
    ano_letivo = models.PositiveIntegerField(default=2026)

    titulo = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, default="")
    data = models.DateField()
    data_entrega = models.DateField(null=True, blank=True)
    arquivo = models.FileField(upload_to="atividades/%Y/%m/", null=True, blank=True)

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-data"]

    def __str__(self):
        return f"{self.titulo} - {self.turma} - {self.data}"


class AtividadeQuestao(models.Model):
    """Questão respondida pelo aluno na própria plataforma (atividade sem arquivo)."""
    TIPO_CHOICES = [
        ("OBJETIVA", "Objetiva"),
        ("SUBJETIVA", "Subjetiva"),
    ]

    atividade = models.ForeignKey(Atividade, on_delete=models.CASCADE, related_name="questoes")
    ordem = models.PositiveIntegerField(default=0)
    enunciado = models.TextField()
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default="OBJETIVA")

    class Meta:
        ordering = ["ordem", "id"]


class AtividadeAlternativa(models.Model):
    questao = models.ForeignKey(AtividadeQuestao, on_delete=models.CASCADE, related_name="alternativas")
    letra = models.CharField(max_length=1)
    texto = models.CharField(max_length=300)
    correta = models.BooleanField(default=False)

    class Meta:
        ordering = ["letra"]


class AtividadeEnvio(models.Model):
    ALTERACAO_STATUS_CHOICES = [
        ("NENHUMA", "Sem solicitação"),
        ("SOLICITADA", "Solicitada"),
        ("APROVADA", "Aprovada"),
        ("NEGADA", "Negada"),
    ]

    atividade = models.ForeignKey(Atividade, on_delete=models.CASCADE, related_name="envios")
    aluno = models.ForeignKey("app.Estudante", on_delete=models.CASCADE, related_name="envios_atividade")
    # Opcional: o aluno pode só responder as questões da atividade na plataforma
    arquivo = models.FileField(upload_to="envios_atividades/%Y/%m/", null=True, blank=True)
    comentario = models.TextField(blank=True, default="")
    respostas_livres = models.JSONField(blank=True, default=list)
    enviado_em = models.DateTimeField(auto_now=True)
    alteracao_status = models.CharField(
        max_length=10,
        choices=ALTERACAO_STATUS_CHOICES,
        default="NENHUMA",
    )
    alteracao_solicitada_em = models.DateTimeField(null=True, blank=True)
    parecer_professor = models.TextField(blank=True, default="")
    visto_emitido_em = models.DateTimeField(null=True, blank=True)
    visto_assinatura = models.CharField(max_length=64, blank=True, default="")
    visto_dados = models.JSONField(default=dict, blank=True)
    visto_pdf = models.FileField(
        upload_to="vistos_atividades/%Y/%m/",
        null=True,
        blank=True,
    )

    # Devolutiva do professor
    feedback = models.TextField(blank=True, default="", db_default="")
    nota = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    corrigido_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("atividade", "aluno")
        ordering = ["aluno__nome_completo"]

    def __str__(self):
        return f"{self.aluno} - {self.atividade}"


class AtividadeResposta(models.Model):
    envio = models.ForeignKey(AtividadeEnvio, on_delete=models.CASCADE, related_name="respostas")
    questao = models.ForeignKey(AtividadeQuestao, on_delete=models.CASCADE, related_name="respostas")
    alternativa = models.ForeignKey(AtividadeAlternativa, on_delete=models.SET_NULL, null=True, blank=True)
    texto = models.TextField(blank=True, default="")

    class Meta:
        unique_together = ("envio", "questao")



class Coordenador(models.Model):
    nome_completo = models.CharField(max_length=255)
    senha = models.CharField(max_length=255)
    escola = models.CharField(max_length=255, blank=True, default="")
    ip = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return self.nome_completo


class Advertencia(models.Model):
    TIPO_CHOICES = [
        ("ADVERTENCIA", "Advertência"),
        ("PENALIDADE", "Penalidade"),
    ]

    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default="ADVERTENCIA")
    aluno = models.ForeignKey(
        Estudante, null=True, blank=True, on_delete=models.CASCADE, related_name="advertencias"
    )
    professor = models.ForeignKey(
        Professor, null=True, blank=True, on_delete=models.CASCADE, related_name="advertencias"
    )
    coordenador = models.ForeignKey(
        Coordenador, null=True, blank=True, on_delete=models.CASCADE, related_name="advertencias_emitidas"
    )
    titulo = models.CharField(max_length=255)
    descricao = models.TextField()
    data = models.DateField(default=date.today)

    is_suspensao = models.BooleanField(default=False)
    data_inicio_suspensao = models.DateField(null=True, blank=True)
    data_termino_suspensao = models.DateField(null=True, blank=True)


class Comunicado(models.Model):
    professor = models.ForeignKey(
        Professor, null=True, blank=True, on_delete=models.CASCADE, related_name="comunicados"
    )
    coordenador = models.ForeignKey(
        Coordenador, null=True, blank=True, on_delete=models.CASCADE, related_name="comunicados"
    )
    turma = models.ForeignKey(
        AtravessaPor, null=True, blank=True, on_delete=models.CASCADE
    )
    titulo = models.CharField(max_length=255)
    mensagem = models.TextField()
    data = models.DateField(default=date.today)


class HorarioAula(models.Model):
    DIA_CHOICES = [
        ("SEG", "Segunda-feira"),
        ("TER", "Terça-feira"),
        ("QUA", "Quarta-feira"),
        ("QUI", "Quinta-feira"),
        ("SEX", "Sexta-feira"),
    ]

    turma = models.ForeignKey(
        AtravessaPor, on_delete=models.CASCADE, related_name="horarios"
    )
    dia_semana = models.CharField(max_length=3, choices=DIA_CHOICES)
    hora_inicio = models.TimeField()
    hora_fim = models.TimeField()

    class Meta:
        ordering = ["dia_semana", "hora_inicio"]

    def __str__(self):
        return f"{self.turma.turma} — {self.get_dia_semana_display()} {self.hora_inicio}–{self.hora_fim}"


class Blogger(models.Model):
    nome_completo = models.CharField(max_length=255)
    senha = models.CharField(max_length=255)
    ip = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return self.nome_completo


class Avaliacao(models.Model):
    professor = models.ForeignKey(Professor, on_delete=models.CASCADE, related_name="avaliacoes")
    turma = models.CharField(max_length=100)
    disciplina = models.ForeignKey(Disciplina, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=200)
    descricao = models.TextField(blank=True, null=True)
    texto_introdutorio = models.TextField(blank=True, default="", help_text="Texto introdutório da avaliação (ex: 'Leia o texto para responder as questões de 1-10')")
    data = models.DateField()
    ano_letivo = models.IntegerField()
    data_criacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.titulo} - {self.turma}"


class Questao(models.Model):
    TIPO_CHOICES = [
        ("OBJETIVA", "Objetiva"),
        ("SUBJETIVA", "Subjetiva"),
    ]

    avaliacao = models.ForeignKey(Avaliacao, on_delete=models.CASCADE, related_name="questoes")
    questao_pai = models.ForeignKey('self', on_delete=models.CASCADE, related_name='subquestoes', null=True, blank=True)
    letra_subquestao = models.CharField(max_length=1, null=True, blank=True, help_text="Letra da subquestão (a, b, c, etc.)")
    ordem = models.PositiveIntegerField(default=0)
    enunciado = models.TextField()
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default="OBJETIVA")
    imagem = models.ImageField(upload_to="avaliacoes/questoes/", blank=True, null=True)
    linhas_resposta = models.PositiveIntegerField(default=2, help_text="Número de linhas para resposta em questões subjetivas")
    topico = models.CharField(max_length=100, blank=True, null=True, help_text="Tópico da questão (ex: Situação A, Tópico 1)")

    class Meta:
        ordering = ["ordem", "id"]


class Alternativa(models.Model):
    questao = models.ForeignKey(Questao, on_delete=models.CASCADE, related_name="alternativas")
    letra = models.CharField(max_length=1, null=True)  # A, B, C, D, E
    texto = models.CharField(max_length=300)
    correta = models.BooleanField(default=False)

    class Meta:
        ordering = ["letra"]


class Conversa(models.Model):
    professor = models.ForeignKey('Professor', on_delete=models.CASCADE, related_name='conversas')
    coordenador = models.ForeignKey('Coordenador', on_delete=models.CASCADE, related_name='conversas')
    data_criacao = models.DateTimeField(auto_now_add=True)
    ultima_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('professor', 'coordenador')

    def __str__(self):
        return f"Conversa: {self.coordenador} <-> {self.professor}"


class MensagemChat(models.Model):
    REMETENTE_CHOICES = [
        ('PROFESSOR', 'Professor'),
        ('COORDENACAO', 'Coordenação'),
    ]

    conversa = models.ForeignKey(Conversa, on_delete=models.CASCADE, related_name='mensagens')
    remetente_tipo = models.CharField(max_length=20, choices=REMETENTE_CHOICES)
    conteudo = models.TextField()
    data_envio = models.DateTimeField(auto_now_add=True)
    lida_professor = models.BooleanField(default=False)
    lida_coordenacao = models.BooleanField(default=False)

    class Meta:
        ordering = ['data_envio']

    
class Admin(models.Model):
    nome_completo = models.CharField(max_length=255)
    senha = models.CharField(max_length=255)
    ip = models.CharField(max_length=45, null=True, blank=True)

    def __str__(self):
        return self.nome_completo


class Escola(models.Model):
    nome = models.CharField(max_length=255, unique=True)
    inep = models.CharField(max_length=20, unique=True, null=True, blank=True)
    endereco = models.TextField(blank=True, default="")
    contato = models.CharField(max_length=255, blank=True, default="")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome

    class Meta:
        ordering = ['nome']


class EstudoProgramado(models.Model):
    aluno = models.ForeignKey('Estudante', on_delete=models.CASCADE, related_name='estudos_programados')
    titulo = models.CharField(max_length=255)
    disciplina = models.CharField(max_length=255, blank=True)
    data = models.DateField()
    concluido = models.BooleanField(default=False)
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['data']

    def __str__(self):
        return f"{self.titulo} — {self.aluno}"


class Responsavel(models.Model):
    nome_completo = models.CharField(max_length=255)
    senha = models.CharField(max_length=255, blank=True, default="")
    ip = models.CharField(max_length=45, null=True, blank=True)

    def __str__(self):
        return self.nome_completo


class VinculoResponsavel(models.Model):
    STATUS_CHOICES = [
        ("PENDENTE", "Pendente"),
        ("APROVADO", "Aprovado"),
        ("RECUSADO", "Recusado"),
    ]

    ORIGEM_CHOICES = [
        ("ALUNO", "Criado pelo aluno"),
        ("RESPONSAVEL", "Solicitado pelo responsável"),
    ]

    origem = models.CharField(max_length=15, choices=ORIGEM_CHOICES, default="ALUNO")

    aluno = models.ForeignKey('Estudante', on_delete=models.CASCADE, related_name='vinculos_responsavel')
    responsavel = models.ForeignKey(Responsavel, on_delete=models.CASCADE, related_name='vinculos_aluno')
    parentesco = models.CharField(max_length=100, blank=True, default="")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="PENDENTE")
    data_solicitacao = models.DateTimeField(auto_now_add=True)
    data_resposta = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('aluno', 'responsavel')
        ordering = ['-data_solicitacao']

    def __str__(self):
        return f"{self.responsavel} -> {self.aluno} ({self.status})"

class ConversaResponsavelProfessor(models.Model):
    responsavel = models.ForeignKey(Responsavel, on_delete=models.CASCADE, related_name='conversas_professor')
    professor = models.ForeignKey(Professor, on_delete=models.CASCADE, related_name='conversas_responsaveis')
    aluno = models.ForeignKey(Estudante, on_delete=models.CASCADE, related_name='conversas_responsavel_professor')
    data_criacao = models.DateTimeField(auto_now_add=True)
    ultima_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('responsavel', 'professor', 'aluno')


class MensagemChatResponsavelProfessor(models.Model):
    REMETENTE_CHOICES = [('RESPONSAVEL', 'Responsável'), ('PROFESSOR', 'Professor')]
    conversa = models.ForeignKey(ConversaResponsavelProfessor, on_delete=models.CASCADE, related_name='mensagens')
    remetente_tipo = models.CharField(max_length=20, choices=REMETENTE_CHOICES)
    conteudo = models.TextField()
    data_envio = models.DateTimeField(auto_now_add=True)
    lida_responsavel = models.BooleanField(default=False)
    lida_professor = models.BooleanField(default=False)

    class Meta:
        ordering = ['data_envio']


class ConversaResponsavelCoordenador(models.Model):
    responsavel = models.ForeignKey(Responsavel, on_delete=models.CASCADE, related_name='conversas_coordenador')
    coordenador = models.ForeignKey(Coordenador, on_delete=models.CASCADE, related_name='conversas_responsaveis')
    aluno = models.ForeignKey(Estudante, on_delete=models.CASCADE, related_name='conversas_responsavel_coordenador')
    data_criacao = models.DateTimeField(auto_now_add=True)
    ultima_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('responsavel', 'coordenador', 'aluno')



class MensagemChatResponsavelCoordenador(models.Model):
    REMETENTE_CHOICES = [('RESPONSAVEL', 'Responsável'), ('COORDENACAO', 'Coordenação')]
    conversa = models.ForeignKey(ConversaResponsavelCoordenador, on_delete=models.CASCADE, related_name='mensagens')
    remetente_tipo = models.CharField(max_length=20, choices=REMETENTE_CHOICES)
    conteudo = models.TextField()
    data_envio = models.DateTimeField(auto_now_add=True)
    lida_responsavel = models.BooleanField(default=False)
    lida_coordenacao = models.BooleanField(default=False)

    class Meta:
        ordering = ['data_envio']


def gerar_token_sessao():
    return secrets.token_hex(16)

class Sessao(models.Model):
    TIPO_CHOICES = [
        ("ALUNO", "Aluno"),
        ("PROFESSOR", "Professor"),
        ("RESPONSAVEL", "Responsável"),
        ("COORDENADOR", "Coordenador"),
        ("ADMIN", "Admin"),
    ]
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    referencia_id = models.PositiveIntegerField()
    nome_completo = models.CharField(max_length=255)
    # token = models.CharField(max_length=64, unique=True, default=lambda: secrets.token_hex(32))
    token = models.CharField(max_length=64, unique=True, default=gerar_token_sessao)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nome_completo} ({self.tipo})"

class Post(models.Model):
    autor_tipo = models.CharField(max_length=20, choices=Sessao.TIPO_CHOICES, default="ALUNO")
    autor_id = models.PositiveIntegerField(default=0)
    autor_nome = models.CharField(max_length=255, default="")
    titulo = models.CharField(max_length=255)
    conteudo = models.TextField()
    imagem = models.ImageField(upload_to="blog/posts/%Y/%m/", null=True, blank=True)
    tempo_leitura = models.PositiveIntegerField(default=1)

    data_criacao = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-data_criacao"]

    def calcular_tempo_leitura(self):
        palavras = re.findall(r"\w+", self.conteudo or "")
        total_palavras = len(palavras)
        minutos = math.ceil(total_palavras / 200) if total_palavras > 0 else 1
        return max(minutos, 1)

    def save(self, *args, **kwargs):
        self.tempo_leitura = self.calcular_tempo_leitura()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.titulo} - {self.autor_nome}"


class Comentario(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comentarios")
    autor_tipo = models.CharField(max_length=20, choices=Sessao.TIPO_CHOICES)
    autor_id = models.PositiveIntegerField()
    autor_nome = models.CharField(max_length=255)
    conteudo = models.TextField()
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["data_criacao"]


class Curtida(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="curtidas")
    autor_tipo = models.CharField(max_length=20, choices=Sessao.TIPO_CHOICES)
    autor_id = models.PositiveIntegerField()
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("post", "autor_tipo", "autor_id")



class PerfilBlog(models.Model):
    tipo = models.CharField(max_length=20, choices=Sessao.TIPO_CHOICES)
    referencia_id = models.PositiveIntegerField()
    nome_usuario = models.CharField(max_length=30, unique=True)
    bio = models.TextField(blank=True, default="")
    data_nascimento = models.DateField(null=True, blank=True)
    foto_perfil = models.ImageField(upload_to="blog/perfis/%Y/%m/", null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("tipo", "referencia_id")

    def __str__(self):
        return f"@{self.nome_usuario}"