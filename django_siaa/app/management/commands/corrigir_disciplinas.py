from django.core.management.base import BaseCommand
from django.db import transaction
from app.models import AtravessaPor, Disciplina


class Command(BaseCommand):
    help = (
        "Detecta registros de AtravessaPor com múltiplas disciplinas "
        "concatenadas (e possivelmente truncadas) em 'disciplina_lecionada', "
        "e propõe a divisão em um registro por disciplina, casando por prefixo."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Aplica as mudanças de fato. Sem essa flag, roda em modo dry-run (só exibe).",
        )

    def handle(self, *args, **options):
        aplicar = options["apply"]

        registros_afetados = AtravessaPor.objects.filter(disciplina_lecionada__contains=",")
        todas_disciplinas = list(Disciplina.objects.all())

        self.stdout.write(f"Total de registros afetados: {registros_afetados.count()}\n")

        ambiguos = []
        sem_match = []
        prontos = []  # (registro, [lista de Disciplina casadas])

        for registro in registros_afetados:
            fragmentos = [f.strip() for f in registro.disciplina_lecionada.split(",") if f.strip()]
            casadas = []
            problema = False

            for fragmento in fragmentos:
                candidatos = [
                    d for d in todas_disciplinas
                    if d.nome_disciplina.upper().startswith(fragmento.upper())
                ]

                if len(candidatos) == 0:
                    sem_match.append((registro.id, fragmento))
                    problema = True
                elif len(candidatos) > 1:
                    ambiguos.append((registro.id, fragmento, [c.nome_disciplina for c in candidatos]))
                    problema = True
                else:
                    casadas.append(candidatos[0])

            if not problema:
                prontos.append((registro, casadas))

        self.stdout.write(self.style.WARNING(f"\n=== Fragmentos SEM correspondência ({len(sem_match)}) ==="))
        for reg_id, fragmento in sem_match:
            self.stdout.write(f"  Registro {reg_id}: '{fragmento}' — nenhuma disciplina encontrada")

        self.stdout.write(self.style.WARNING(f"\n=== Fragmentos AMBÍGUOS ({len(ambiguos)}) ==="))
        for reg_id, fragmento, opcoes in ambiguos:
            self.stdout.write(f"  Registro {reg_id}: '{fragmento}' bate com múltiplas:")
            for opcao in opcoes:
                self.stdout.write(f"      - {opcao}")

        self.stdout.write(self.style.SUCCESS(f"\n=== Registros prontos para correção ({len(prontos)}) ==="))
        for registro, casadas in prontos:
            nomes = ", ".join(d.nome_disciplina for d in casadas)
            self.stdout.write(f"  Registro {registro.id} (turma: {registro.turma}, professor: {registro.professor_id})")
            self.stdout.write(f"    -> {len(casadas)} disciplinas: {nomes}")

        if not aplicar:
            self.stdout.write(self.style.WARNING(
                "\nModo dry-run. Nenhuma alteração foi feita. "
                "Rode novamente com --apply para aplicar as correções nos registros SEM ambiguidade."
            ))
            return

        self.stdout.write(self.style.WARNING("\nAplicando correções..."))

        with transaction.atomic():
            for registro, casadas in prontos:
                for disciplina in casadas:
                    AtravessaPor.objects.create(
                        professor_id=registro.professor_id,
                        escola=registro.escola,
                        turma=registro.turma,
                        etapa=registro.etapa,
                        disciplina_lecionada=disciplina.nome_disciplina,
                    )
                registro.delete()

        self.stdout.write(self.style.SUCCESS(
            f"\n{len(prontos)} registros corrigidos e divididos com sucesso. "
            f"{len(sem_match) + len(ambiguos)} fragmentos precisam de revisão manual."
        ))