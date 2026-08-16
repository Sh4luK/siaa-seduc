import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from ...models import AtravessaPor, Professor


class Command(BaseCommand):
    help = "Importa todas as turmas (AtravessaPor) a partir de um arquivo JSON (ex: turmasExportadas.json)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--arquivo",
            type=str,
            default=None,
            help="Caminho do arquivo JSON de turmas (padrão: turmasExportadas.json)",
        )
        parser.add_argument(
            "--limpar",
            action="store_true",
            help="Limpa todos os registros de turmas existentes antes de importar",
        )

    def _garantir_professores(self, prof_ids_necessarios):
        """Garante que os professores referenciados existam no banco."""
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
                self.style.SUCCESS(f"-> {criados} professores importados com sucesso.")
            )

    def handle(self, *args, **options):
        caminho_informado = options.get("arquivo")

        if caminho_informado:
            json_path = Path(caminho_informado).resolve()
        else:
            possiveis = [
                Path("turmasExportadas.json"),
                Path("django_siaa/turmasExportadas.json"),
                Path("../django_siaa/turmasExportadas.json"),
            ]
            json_path = None
            for p in possiveis:
                if p.exists():
                    json_path = p.resolve()
                    break

        if not json_path or not json_path.exists():
            self.stdout.write(self.style.ERROR("ERRO: Arquivo JSON de turmas não encontrado."))
            return

        self.stdout.write(self.style.SUCCESS(f"-> Lendo arquivo: {json_path}"))

        try:
            with open(json_path, "r", encoding="utf-8") as f:
                dados = json.load(f)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro crítico ao ler/decodificar o JSON: {str(e)}"))
            return

        if not isinstance(dados, list):
            self.stdout.write(self.style.ERROR("ERRO: Formato inválido. Esperava uma lista de turmas."))
            return

        prof_ids = {item.get("professor") for item in dados if item.get("professor") is not None}

        with transaction.atomic():
            if options.get("limpar"):
                removidos, _ = AtravessaPor.objects.all().delete()
                self.stdout.write(self.style.WARNING(f"-> {removidos} turmas anteriores removidas."))

            self._garantir_professores(prof_ids)

            total_salvas = 0
            for item in dados:
                t_id = item.get("id")
                prof_id = item.get("professor")
                escola = item.get("escola")
                turma = item.get("turma")
                etapa = item.get("etapa")
                disciplina_lecionada = item.get("disciplina_lecionada")

                if t_id is not None:
                    AtravessaPor.objects.update_or_create(
                        id=t_id,
                        defaults={
                            "professor_id": prof_id,
                            "escola": escola,
                            "turma": turma,
                            "etapa": etapa,
                            "disciplina_lecionada": disciplina_lecionada,
                        },
                    )
                else:
                    AtravessaPor.objects.create(
                        professor_id=prof_id,
                        escola=escola,
                        turma=turma,
                        etapa=etapa,
                        disciplina_lecionada=disciplina_lecionada,
                    )
                total_salvas += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"🚀 SUCESSO! {total_salvas} registros de turmas (AtravessaPor) gravados no banco de dados."
            )
        )
