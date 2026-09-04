from django.db import models
from decimal import Decimal
from django.db import models
from datetime import date
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
        MEDIA_MINIMA = Decimal("6.0")

        for t in (1, 2, 3):
            notas = [getattr(self, f"nm{i}_t{t}") for i in (1, 2, 3)]
            mt = self._media(notas)
            setattr(self, f"mt_t{t}", mt)

            rpt = getattr(self, f"rpt_t{t}")
            mtf = rpt if rpt is not None else mt
            setattr(self, f"mtf_t{t}", mtf)

        mtfs = [self.mtf_t1, self.mtf_t2, self.mtf_t3]
        self.ma = self._media(mtfs)

        if self.ma is None:
            self.maf = None
        elif self.ma >= MEDIA_MINIMA or self.pf is None:
            self.maf = self.ma
        else:
            self.maf = round((self.ma + self.pf) / 2, 1)

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

class Post(models.Model):
    autor = models.ForeignKey(Blogger, on_delete=models.CASCADE, related_name="posts")
    titulo = models.CharField(max_length=255)
    conteudo = models.TextField()
    tempo_leitura = models.PositiveIntegerField(default=1)  # em minutos

    data_criacao = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-data_criacao"]

    def calcular_tempo_leitura(self):
        """Estima o tempo de leitura com base na contagem de palavras (~200 palavras/min)."""
        palavras = re.findall(r"\w+", self.conteudo or "")
        total_palavras = len(palavras)
        minutos = math.ceil(total_palavras / 200) if total_palavras > 0 else 1
        return max(minutos, 1)

    def save(self, *args, **kwargs):
        self.tempo_leitura = self.calcular_tempo_leitura()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.titulo} - {self.autor}"

# app/models.py — adicionar

class Avaliacao(models.Model):
    professor = models.ForeignKey(Professor, on_delete=models.CASCADE, related_name="avaliacoes")
    turma = models.CharField(max_length=100)
    disciplina = models.ForeignKey(Disciplina, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=200)
    descricao = models.TextField(blank=True, null=True)
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
    ordem = models.PositiveIntegerField(default=0)
    enunciado = models.TextField()
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default="OBJETIVA")
    imagem = models.ImageField(upload_to="avaliacoes/questoes/", blank=True, null=True)

    class Meta:
        ordering = ["ordem", "id"]


class Alternativa(models.Model):
    questao = models.ForeignKey(Questao, on_delete=models.CASCADE, related_name="alternativas")
    letra = models.CharField(max_length=1, null=True)  # A, B, C, D, E
    texto = models.CharField(max_length=300)
    correta = models.BooleanField(default=False)

    class Meta:
        ordering = ["letra"]


# class Avaliacao(models.Model):
#     professor = models.ForeignKey(Professor, on_delete=models.CASCADE, related_name="avaliacoes")
#     turma = models.ForeignKey(AtravessaPor, on_delete=models.CASCADE, related_name="avaliacoes")
#     titulo = models.CharField(max_length=255)
#     curso = models.CharField(max_length=255, blank=True)
#     data = models.DateField(default=date.today)

#     def __str__(self):
#         return f"{self.titulo} — {self.turma.turma}"


# class Questao(models.Model):
#     TIPO_CHOICES = [
#         ("DISSERTATIVA", "Dissertativa"),
#         ("OBJETIVA", "Objetiva"),
#     ]

#     avaliacao = models.ForeignKey(Avaliacao, on_delete=models.CASCADE, related_name="questoes")
#     ordem = models.PositiveIntegerField(default=0)
#     tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
#     enunciado = models.TextField()

#     class Meta:
#         ordering = ["ordem"]

# class Alternativa(models.Model):
#     questao = models.ForeignKey(Questao, on_delete=models.CASCADE, related_name="alternativas")
#     ordem = models.PositiveIntegerField(default=0)
#     texto = models.CharField(max_length=500)

#     class Meta:
#         ordering = ["ordem"]


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
    cpf = models.CharField(max_length=20, blank=True, default="")
    telefone = models.CharField(max_length=30, blank=True, default="")
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

