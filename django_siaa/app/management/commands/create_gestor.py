from django.core.management.base import BaseCommand
from app.models import Coordenador


class Command(BaseCommand):
    help = "Cria um coordenador inicial"

    def handle(self, *args, **options):
        nome = "JOSE IRAILDES CIPRIANO RIBEIRO FILHO"
        senha = "JOSE123"
        escola = "22057498 - CETI CALISTO LOBO"

        if Coordenador.objects.filter(nome_completo=nome).exists():
            self.stdout.write(self.style.WARNING("Esse coordenador já existe."))
            return

        Coordenador.objects.create(nome_completo=nome, senha=senha, escola=escola)
        self.stdout.write(self.style.SUCCESS("Coordenador criado com sucesso."))