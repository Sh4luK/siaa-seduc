"""import os
import json
from django.core.management.base import BaseCommand
from app.models import Professor, Disciplina, AtravessaPor

class Command(BaseCommand):
    help = "Carga relacional completa de professores, displina e turmas"

    def handle(self, *args, **options):
        json_path = os.path.abspath("../infra/dados_escolas.json")

        if not os.path.exists(json_path):
            json_path = os.path.abspath("dados_escolas")

        if not os.path.exists(json_path):
            self.stdout.write(self.style.ERROR(f"Arquivo nao encontrado na raiz. Caminho testado: {json_path}"))
            return
        
        self.stdout.write(self.style.SUCCESS(f"Lendo dados do arquivo: {json_path}"))

        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        lista_dados = data if isinstance(data, list) else data.get("professores", [])


        if not lista_dados:
            self.stdout.write(self.style.ERROR("Nenhum dados valido localizado na lista."))
            return
        
        for item in lista_dados:
            nome_professor = item.get("PROFESSOR", "").strip().upper()

            if not nome_professor:
                continue

            professor_obj, criado = Professor.objects.get_or_create(nome_completo=nome_professor)
            if criado:
                self.stdout.write(self.style.SUCCESS(f"Cadastrando Professor -> {nome_professor}"))
            else:
                self.stdout.write(self.style.WARNING(f"Professor já existente, atualizando vinculos -> {nome_professor}"))
        lista_disciplinas = item.get("DISCIPLINA", [])
        for disc_nome in lista_disciplinas:
            disc_nome_limpo = disc_nome.strip().upper()
            if disc_nome_limpo:
                disciplina_obj, _ = Disciplina.objects.get_or_create(nome_disciplina=disc_nome_limpo)
                disciplina_obj.professores.add(professor_obj)

            lista_atravessamentos = item.get("ATAVESSA_POR", [])
            for at_item in lista_atravessamentos:
                escola = at_item.get("ESCOLA", "").strip().upper()
                turma = at_item.get("TURMA", "").strip().upper()
                etapa = at_item.get("ETAPA", "").strip().upper()
            
            if not AtravessaPor.objects.filter(professor=professor_obj, escola=escola, turma=turma, etapa=etapa).exists():
                AtravessaPor.objects.create(
                    professor=professor_obj,
                    escola=escola,
                    turma=turma,
                    etapa=etapa
                )
        self.stdout.write(self.style.WARNING("Processo de importação relacional concluido."))
"""
import os
import json
from django.core.management.base import BaseCommand
from app.models import Professor, Disciplina, AtravessaPor  # Altere 'meu_app' para o seu app real

class Command(BaseCommand):
    help = 'Carga relacional completa de professores, disciplinas e turmas'

    def handle(self, *args, **options):
        # Localiza o arquivo de forma direta na raiz do terminal
        json_path = os.path.abspath('../infra/dados_escolas.json')

        if not os.path.exists(json_path):
            # Testa a versão sem extensão
            json_path = os.path.abspath('../infra/dados_escolas')

        if not os.path.exists(json_path):
            self.stdout.write(self.style.ERROR(f"Arquivo não localizado na raiz. Caminho tentado: {json_path}"))
            return

        self.stdout.write(self.style.SUCCESS(f"Lendo dados do arquivo: {json_path}"))

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                dados = json.load(f)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro ao ler ou decodificar o arquivo: {str(e)}"))
            return

        # Trata se o arquivo for uma lista direta de objetos ou envelopada
        lista_dados = dados if isinstance(dados, list) else dados.get('professores', [])

        if not lista_dados:
            self.stdout.write(self.style.ERROR("Nenhum dado válido localizado na lista."))
            return

        for item in lista_dados:
            # Captura a chave em caixa alta "PROFESSOR"
            nome_professor = item.get('PROFESSOR', '').strip().upper()
            
            if not nome_professor:
                continue

            # 1. Cria ou recupera o Professor para evitar duplicidade
            primeiro_nome = nome_professor.split()[0]
            senha_padrao = f"{primeiro_nome}@prof"
            professor_obj, criado = Professor.objects.get_or_create(nome_completo=nome_professor, senha=senha_padrao)
            if criado:
                self.stdout.write(self.style.SUCCESS(f"Cadastrando Professor: {nome_professor}"))
            else:
                self.stdout.write(self.style.WARNING(f"Professor já existente, atualizando vínculos: {nome_professor}"))

            # 2. Processa a lista em caixa alta "DISCIPLINA"
            lista_disciplinas = item.get('DISCIPLINA', [])
            for disc_nome in lista_disciplinas:
                disc_nome_limpo = disc_nome.strip().upper()
                if disc_nome_limpo:
                    # Garante que a disciplina existe globalmente
                    disciplina_obj, _ = Disciplina.objects.get_or_create(nome_disciplina=disc_nome_limpo)
                    # Vincula o professor a esta disciplina
                    disciplina_obj.professores.add(professor_obj)

            # 3. Processa a lista em caixa alta "ATRAVESSA_POR"
            lista_atravessamentos = item.get('ATRAVESSA_POR', [])
            for at_item in lista_atravessamentos:
                # Mudança das variáveis para evitar o erro de escopo (UnboundLocalError)
                escola_texto = at_item.get('ESCOLA', '').strip().upper()
                turma_texto = at_item.get('TURMA', '').strip().upper()
                etapa_texto = at_item.get('ETAPA', '').strip().upper()

                # Verifica se o vínculo exato já foi salvo para não gerar duplicidade
                if not AtravessaPor.objects.filter(
                    professor=professor_obj, 
                    escola=escola_texto, 
                    turma=turma_texto, 
                    etapa=etapa_texto
                ).exists():
                    AtravessaPor.objects.create(
                        professor=professor_obj,
                        escola=escola_texto,
                        turma=turma_texto,
                        etapa=etapa_texto
                    )

        self.stdout.write(self.style.SUCCESS("🚀 Processo de importação relacional concluído com sucesso!"))
