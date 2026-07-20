from django.db import models
from decimal import Decimal
from django.db import models

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