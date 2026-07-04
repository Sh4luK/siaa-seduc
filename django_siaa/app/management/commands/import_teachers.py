import os
import json
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from app.models import Professor, Disciplina, AtravessaPor

class Command(BaseCommand):
    help = 'Carga relacional completa de professores utilizando o arquivo dados_escolas.json'

    def handle(self, *args, **options):
        json_path = os.path.abspath('../infra/dados_escolas.json')

        if not os.path.exists(json_path):
            self.stdout.write(self.style.ERROR(f"ERRO: Arquivo não localizado em {json_path}. Execute o script do Pandas primeiro."))
            return

        self.stdout.write(self.style.SUCCESS(f"Lendo dados de: {json_path}"))

        with open(json_path, 'r', encoding='utf-8') as f:
            lista_dados = json.load(f)

        self.stdout.write(self.style.WARNING("Limpando registros antigos para reestruturação..."))
        AtravessaPor.objects.all().delete()
        Disciplina.objects.all().delete()
        Professor.objects.all().delete()

        total_professores = 0

        for item in lista_dados:
            nome_professor = item.get('PROFESSOR', '').strip().upper()
            if not nome_professor:
                continue

            primeiro_nome = nome_professor.split()[0]
            senha_padrao = f"{primeiro_nome}123"

            professor_obj = Professor.objects.create(
                nome_completo=nome_professor,
                senha=senha_padrao
            )
            total_professores += 1

            lista_disciplinas = item.get('DISCIPLINA', [])
            for disc_nome in lista_disciplinas:
                disc_nome_limpo = disc_nome.strip().upper()
                if disc_nome_limpo:
                    disciplina_obj, _ = Disciplina.objects.get_or_create(nome_disciplina=disc_nome_limpo)
                    disciplina_obj.professores.add(professor_obj)

            lista_atravessamentos = item.get('ATRAVESSA_POR', [])
            for at_item in lista_atravessamentos:
                escola_texto = at_item.get('ESCOLA', '').strip().upper()
                turma_texto = at_item.get('TURMA', '').strip().upper()
                etapa_texto = at_item.get('ETAPA', '').strip().upper()
                
                array_disciplinas_dadas = at_item.get('DISCIPLINA_DADA', [])
                disciplinas_str = ", ".join(array_disciplinas_dadas).strip().upper()

                AtravessaPor.objects.create(
                    professor=professor_obj,
                    escola=escola_texto,
                    turma=turma_texto,
                    etapa=etapa_texto,
                    disciplina_lecionada=disciplinas_str
                )

        self.stdout.write(self.style.SUCCESS(f"🚀 Banco de dados populado com sucesso! {total_professores} professores e seus respectivos diários foram cadastrados."))
