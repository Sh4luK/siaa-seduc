import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.forms.models import model_to_dict
from ...models import Professor


class Command(BaseCommand):
    help = "Exporta todos os professores para um arquivo JSON"

    def add_arguments(self, parser):
        parser.add_argument(
            "--saida",
            type=str,
            default="professores_export.json",
            help="Caminho do arquivo JSON de saída",
        )

    def handle(self, *args, **options):
        saida = Path(options["saida"])

        professores = Professor.objects.all()
        professores_dict = [model_to_dict(professor) for professor in professores]

        with open(saida, "w", encoding="utf-8") as f:
            json.dump(professores_dict, f, ensure_ascii=False, indent=2)

        self.stdout.write(
            self.style.SUCCESS(
                f"{len(professores_dict)} professores exportados para {saida}"
            )
        )