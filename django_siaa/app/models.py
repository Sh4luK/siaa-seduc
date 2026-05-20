from django.db import models

# Create your models here.
class User(models.Model):
    name = models.CharField(max_length=250)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=250)
    phone = models.CharField(max_length=250, null=True)
    regists = models.CharField(max_length=250, null=True)
    

    def __str__(self):
        return self.name