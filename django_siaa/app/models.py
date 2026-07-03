from django.db import models

class Professor(models.Model):
    """id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=300)
    escola = models.CharField(max_length=170, null=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=30, null=True)
    address = models.CharField(max_length=500, null=True)
    cpf = models.CharField(max_length=14, unique=True, null=True)
    is_active = models.BooleanField(default=True)
    materia = models.CharField(max_length=700, null=True)
    classes = models.CharField(max_length=700, null=True)
    ip = models.CharField(max_length=45, null=True)"""
    nome_completo = models.CharField(max_length=255, unique=True, null=True)
    data_cadastro = models.DateTimeField(auto_now_add=True, null=True)
    senha = models.CharField(max_length=150, null=True)
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

class Responsavel(models.Model):
    id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=300)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=30, null=True)
    address = models.CharField(max_length=500, null=True)
    cpf = models.CharField(max_length=14, unique=True, null=True)
    # is_active = models.BooleanField(default=True)
    # student_full_name = models.CharField(max_length=300, null=True)
    # student_matricula = models.CharField(max_length=20, null=True)
    ip = models.CharField(max_length=45, null=True)
    def __str__(self):
        return self.full_name

class Coordenacao(models.Model):
    id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=300)
    escola = models.CharField(max_length=170, null=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=30, null=True)
    address = models.CharField(max_length=500, null=True)
    cpf = models.CharField(max_length=14, unique=True, null=True)
    is_active = models.BooleanField(default=True)
    cargo = models.CharField(max_length=150, null=True)
    ip = models.CharField(max_length=45, null=True)
    def __str__(self):
        return self.full_name

"""
class SuperAdmin(models.Model):
    id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=300, unique=True)
    email = models.EmailField(unique=True)
    escola = models.CharField(max_length=170, null=True)
    phone_number = models.CharField(max_length=30, null=True)
    cpf = models.CharField(max_length=14, unique=True, null=True)
    password = models.CharField(max_length=300, null=True)
    ip = models.CharField(max_length=20, null=True)
    def __str__(self):
        return self.full_name
"""