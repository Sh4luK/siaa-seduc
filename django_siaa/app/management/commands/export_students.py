import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.forms.models import model_to_dict
from ...models import Estudante


class Command(BaseCommand):
    help = "Exporta todos os estudantes para um arquivo JSON"

    def add_arguments(self, parser):
        parser.add_argument(
            "--saida",
            type=str,
            default="estudantes_export.json",
            help="Caminho do arquivo JSON de saída",
        )

    def handle(self, *args, **options):
        saida = Path(options["saida"])

        estudantes = Estudante.objects.all()
        estudantes_dict = [model_to_dict(estudante) for estudante in estudantes]

        with open(saida, "w", encoding="utf-8") as f:
            json.dump(estudantes_dict, f, ensure_ascii=False, indent=2)

        self.stdout.write(
            self.style.SUCCESS(
                f"{len(estudantes_dict)} estudantes exportados para {saida}"
            )
        )