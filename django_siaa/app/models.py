from django.db import models

class Professor(models.Model):
    id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=300)
    escola = models.CharField(max_length=170, null=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=30, null=True)
    address = models.CharField(max_length=500, null=True)
    cpf = models.CharField(max_length=14, unique=True, null=True)
    is_active = models.BooleanField(default=True)
    materia = models.CharField(max_length=700, null=True)
    classes = models.CharField(max_length=700, null=True)
    ip = models.CharField(max_length=45, null=True)
    def __str__(self):
        return self.full_name

class Estudante(models.Model):
    id = models.AutoField(primary_key=True)
    matricula = models.CharField(max_length=20, unique=True)
    escola = models.CharField(max_length=170, null=True)
    full_name = models.CharField(max_length=300)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=30, null=True)
    address = models.CharField(max_length=500, null=True)
    cpf = models.CharField(max_length=14, unique=True, null=True)
    is_active = models.BooleanField(default=True)
    mom_name = models.CharField(max_length=300, null=True)
    course = models.CharField(max_length=170, null=True)
    ip = models.CharField(max_length=45, null=True)

    def __str__(self):
        return self.full_name

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