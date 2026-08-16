import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from ...models import Professor, Disciplina, AtravessaPor


class Command(BaseCommand):
    help = "Importa e cadastra professores na model Professor a partir de arquivo JSON (ex: professoresExportados.json)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--arquivo",
            type=str,
            default=None,
            help="Caminho do arquivo JSON de professores (padrão: professoresExportados.json)",
        )
        parser.add_argument(
            "--limpar",
            action="store_true",
            help="Limpa todos os professores existentes antes de importar",
        )

    def handle(self, *args, **options):
        caminho_informado = options.get("arquivo")

        if caminho_informado:
            json_path = Path(caminho_informado).resolve()
        else:
            possiveis = [
                Path("professoresExportados.json"),
                Path("django_siaa/professoresExportados.json"),
                Path("../django_siaa/professoresExportados.json"),
                Path("../infra/dados_escolas.json"),
                Path("infra/dados_escolas.json"),
            ]
            json_path = None
            for p in possiveis:
                if p.exists():
                    json_path = p.resolve()
                    break

        if not json_path or not json_path.exists():
            self.stdout.write(self.style.ERROR("ERRO: Arquivo JSON de professores não encontrado."))
            return

        self.stdout.write(self.style.SUCCESS(f"-> Lendo arquivo: {json_path}"))

        try:
            with open(json_path, "r", encoding="utf-8") as f:
                dados = json.load(f)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro crítico ao ler/decodificar o JSON: {str(e)}"))
            return

        with transaction.atomic():
            if options.get("limpar"):
                removidos, _ = Professor.objects.all().delete()
                self.stdout.write(self.style.WARNING(f"-> {removidos} professores anteriores removidos."))

            total_professores = 0

            # Caso 1: Lista exportada direta (professoresExportados.json)
            if isinstance(dados, list) and dados and "nome_completo" in dados[0]:
                for item in dados:
                    p_id = item.get("id")
                    nome = item.get("nome_completo", "").strip().upper()
                    senha = item.get("senha")
                    ip = item.get("ip")

                    if not senha and nome:
                        primeiro_nome = nome.split()[0]
                        senha = f"{primeiro_nome}123"

                    if p_id is not None:
                        Professor.objects.update_or_create(
                            id=p_id,
                            defaults={
                                "nome_completo": nome,
                                "senha": senha,
                                "ip": ip,
                            },
                        )
                    else:
                        Professor.objects.create(
                            nome_completo=nome,
                            senha=senha,
                            ip=ip,
                        )
                    total_professores += 1

            # Caso 2: Formato dados_escolas.json (lista com chaves PROFESSOR, DISCIPLINA, ATRAVESSA_POR)
            elif isinstance(dados, list) and dados and "PROFESSOR" in dados[0]:
                for item in dados:
                    nome_professor = item.get("PROFESSOR", "").strip().upper()
                    if not nome_professor:
                        continue

                    primeiro_nome = nome_professor.split()[0]
                    senha_padrao = f"{primeiro_nome}123"

                    professor_obj, _ = Professor.objects.update_or_create(
                        nome_completo=nome_professor,
                        defaults={"senha": senha_padrao},
                    )
                    total_professores += 1

                    lista_disciplinas = item.get("DISCIPLINA", [])
                    for disc_nome in lista_disciplinas:
                        disc_nome_limpo = disc_nome.strip().upper()
                        if disc_nome_limpo:
                            disciplina_obj, _ = Disciplina.objects.get_or_create(
                                nome_disciplina=disc_nome_limpo
                            )
                            disciplina_obj.professores.add(professor_obj)

                    lista_atravessamentos = item.get("ATRAVESSA_POR", [])
                    for at_item in lista_atravessamentos:
                        escola_texto = at_item.get("ESCOLA", "").strip().upper()
                        turma_texto = at_item.get("TURMA", "").strip().upper()
                        etapa_texto = at_item.get("ETAPA", "").strip().upper()

                        array_disciplinas_dadas = at_item.get("DISCIPLINA_DADA", [])
                        disciplinas_str = ", ".join(array_disciplinas_dadas).strip().upper()

                        AtravessaPor.objects.create(
                            professor=professor_obj,
                            escola=escola_texto,
                            turma=turma_texto,
                            etapa=etapa_texto,
                            disciplina_lecionada=disciplinas_str,
                        )

        self.stdout.write(
            self.style.SUCCESS(
                f"🚀 SUCESSO! {total_professores} professores gravados/atualizados no banco de dados."
            )
        )
