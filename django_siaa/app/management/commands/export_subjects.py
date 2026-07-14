import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.forms.models import model_to_dict
from ...models import Disciplina


class Command(BaseCommand):
    help = "Exporta todas as disciplinas para um arquivo JSON"

    def add_arguments(self, parser):
        parser.add_argument(
            "--saida",
            type=str,
            default="disciplinas_export.json",
            help="Caminho do arquivo JSON de saída",
        )

    def handle(self, *args, **options):
        saida = Path(options["saida"])

        disciplinas = Disciplina.objects.all()
        disciplinas_dict = []

        for disciplina in disciplinas:
            dado = model_to_dict(disciplina, exclude=["professores"])
            # Adiciona apenas os IDs dos professores relacionados
            dado["professores"] = list(
                disciplina.professores.values_list("id", flat=True)
            )
            disciplinas_dict.append(dado)

        with open(saida, "w", encoding="utf-8") as f:
            json.dump(disciplinas_dict, f, ensure_ascii=False, indent=2)

        self.stdout.write(
            self.style.SUCCESS(
                f"{len(disciplinas_dict)} disciplinas exportadas para {saida}"
            )
        )