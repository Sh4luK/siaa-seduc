import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from ...models import Disciplina, Professor


class Command(BaseCommand):
    help = "Importa todas as disciplinas a partir de um arquivo JSON (ex: disciplinasExportadas.json)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--arquivo",
            type=str,
            default=None,
            help="Caminho do arquivo JSON de disciplinas (padrão: disciplinasExportadas.json)",
        )
        parser.add_argument(
            "--limpar",
            action="store_true",
            help="Limpa todas as disciplinas existentes antes de importar",
        )

    def _garantir_professores(self, prof_ids_necessarios):
        """Garante que os professores referenciados existam no banco para preservar os relacionamentos."""
        profs_existentes = set(
            Professor.objects.filter(id__in=prof_ids_necessarios).values_list("id", flat=True)
        )
        faltantes = prof_ids_necessarios - profs_existentes

        if not faltantes:
            return

        self.stdout.write(
            self.style.WARNING(
                f"Detectados {len(faltantes)} professores referenciados que ainda não estão no banco. "
                "Tentando carregar de professoresExportados.json..."
            )
        )

        possiveis_caminhos = [
            Path("professoresExportados.json"),
            Path("django_siaa/professoresExportados.json"),
            Path("../django_siaa/professoresExportados.json"),
        ]

        prof_json_path = None
        for p in possiveis_caminhos:
            if p.exists():
                prof_json_path = p.resolve()
                break

        if prof_json_path:
            with open(prof_json_path, "r", encoding="utf-8") as f:
                profs_data = json.load(f)

            criados = 0
            for item in profs_data:
                p_id = item.get("id")
                if p_id in faltantes or not Professor.objects.filter(id=p_id).exists():
                    Professor.objects.update_or_create(
                        id=p_id,
                        defaults={
                            "nome_completo": item.get("nome_completo"),
                            "senha": item.get("senha"),
                            "ip": item.get("ip"),
                        },
                    )
                    criados += 1
            self.stdout.write(
                self.style.SUCCESS(f"-> {criados} professores importados com sucesso para manter os vínculos.")
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    "Aviso: professoresExportados.json não encontrado. "
                    "Vínculos com professores inexistentes poderão não ser criados."
                )
            )

    def handle(self, *args, **options):
        caminho_informado = options.get("arquivo")

        if caminho_informado:
            json_path = Path(caminho_informado).resolve()
        else:
            possiveis = [
                Path("disciplinasExportadas.json"),
                Path("django_siaa/disciplinasExportadas.json"),
                Path("../django_siaa/disciplinasExportadas.json"),
            ]
            json_path = None
            for p in possiveis:
                if p.exists():
                    json_path = p.resolve()
                    break

        if not json_path or not json_path.exists():
            self.stdout.write(self.style.ERROR("ERRO: Arquivo JSON de disciplinas não encontrado."))
            return

        self.stdout.write(self.style.SUCCESS(f"-> Lendo arquivo: {json_path}"))

        try:
            with open(json_path, "r", encoding="utf-8") as f:
                dados = json.load(f)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro crítico ao ler/decodificar o JSON: {str(e)}"))
            return

        if not isinstance(dados, list):
            self.stdout.write(self.style.ERROR("ERRO: Formato inválido. Esperava uma lista de disciplinas."))
            return

        # Coleta todos os IDs de professores necessários
        todos_prof_ids = set()
        for item in dados:
            todos_prof_ids.update(item.get("professores", []))

        with transaction.atomic():
            if options.get("limpar"):
                removidos, _ = Disciplina.objects.all().delete()
                self.stdout.write(self.style.WARNING(f"-> {removidos} disciplinas anteriores removidas."))

            self._garantir_professores(todos_prof_ids)

            total_salvas = 0
            total_vinculos = 0

            for item in dados:
                disc_id = item.get("id")
                nome = item.get("nome_disciplina")
                prof_ids = item.get("professores", [])

                if disc_id is not None:
                    disciplina, _ = Disciplina.objects.update_or_create(
                        id=disc_id,
                        defaults={"nome_disciplina": nome},
                    )
                else:
                    disciplina = Disciplina.objects.create(nome_disciplina=nome)

                if prof_ids:
                    # Filtra apenas os professores que de fato existem no banco
                    profs_validos = Professor.objects.filter(id__in=prof_ids)
                    disciplina.professores.set(profs_validos)
                    total_vinculos += profs_validos.count()
                else:
                    disciplina.professores.clear()

                total_salvas += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"🚀 SUCESSO! {total_salvas} disciplinas gravadas no banco de dados com {total_vinculos} associações de professores."
            )
        )
