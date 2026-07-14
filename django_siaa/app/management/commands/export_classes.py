import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.forms.models import model_to_dict
from ...models import AtravessaPor


class Command(BaseCommand):
    help = "Exporta todos os registros de AtravessaPor (turmas) para um arquivo JSON"

    def add_arguments(self, parser):
        parser.add_argument(
            "--saida",
            type=str,
            default="turmas_export.json",
            help="Caminho do arquivo JSON de saída",
        )

    def handle(self, *args, **options):
        saida = Path(options["saida"])

        turmas = AtravessaPor.objects.all()
        turmas_dict = [model_to_dict(turma) for turma in turmas]

        with open(saida, "w", encoding="utf-8") as f:
            json.dump(turmas_dict, f, ensure_ascii=False, indent=2)

        self.stdout.write(
            self.style.SUCCESS(
                f"{len(turmas_dict)} turmas exportadas para {saida}"
            )
        )