from django.db import models

class User(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=250)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=250)
    full_name = models.CharField(max_length=300, null=True)
    registration = models.CharField(max_length=20, unique=True, null=True)
    address = models.CharField(max_length=500, null=True)
    phone_number = models.CharField(max_length=30, null=True)
    is_active = models.BooleanField(default=True)
    position = models.CharField(max_length=100, null=True)
    cpf = models.CharField(max_length=14, unique=True, null=True)



    def __str__(self):
        return self.full_name