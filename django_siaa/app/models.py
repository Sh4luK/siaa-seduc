from django.db import models

class User(models.Model):
    username = models.CharField(max_length=250)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=250)

    def __str__(self):
        return self.username