import os
import json
from django.core.management.base import BaseCommand
from app.models import Estudante

class Command(BaseCommand):
    help = 'Força o cadastro de estudantes localizando o arquivo JSON de forma direta'

    def handle(self, *args, **options):
        json_path = os.path.abspath('../infra/alunos_formatados.json')

        if not os.path.exists(json_path):
            self.stdout.write(self.style.ERROR(f"ERRO: O arquivo não foi encontrado no caminho: {json_path}"))
            self.stdout.write(self.style.WARNING("Certifique-se de que o comando está sendo executado na mesma pasta onde o arquivo JSON está salvo."))
            return

        self.stdout.write(self.style.SUCCESS(f"-> Arquivo localizado com sucesso em: {json_path}"))

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data_por_paginas = json.load(f)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro crítico ao ler/decodificar o JSON: {str(e)}"))
            return

        if not data_por_paginas:
            self.stdout.write(self.style.ERROR("O arquivo JSON está vazio."))
            return

        alunos_para_salvar = []
        contador_alunos_lidos = 0

        for pagina_id, conteudo_pagina in data_por_paginas.items():
            escola = conteudo_pagina.get('escola', 'CETI CALISTO LOBO')
            modo_de_ensino = conteudo_pagina.get('modo_de_ensino', 'ENSINO MEDIO TECNICO PROFISSIONAL')
            serie = conteudo_pagina.get('serie', '1ª SERIE - INTEGRAL')
            periodo = conteudo_pagina.get('periodo', '2026/1')
            curso = conteudo_pagina.get('curso', '')
            turma = conteudo_pagina.get('turma', '')
            lista_alunos = conteudo_pagina.get('alunos', [])

            for student in lista_alunos:
                nome_completo = student.get('nome_completo', '').strip().upper()
                posicao_ordem = student.get('posicao_ordem')

                if not nome_completo:
                    continue

                contador_alunos_lidos += 1

                alunos_para_salvar.append(
                    Estudante(
                        posicao_ordem=int(posicao_ordem) if posicao_ordem else 0,
                        nome_completo=nome_completo,
                        escola=escola,
                        modo_de_ensino=modo_de_ensino,
                        serie=serie,
                        periodo=periodo,
                        curso=curso,
                        turma=turma
                    )
                )

        self.stdout.write(self.style.WARNING(f"-> Total de alunos lidos do arquivo: {contador_alunos_lidos}"))

        if alunos_para_salvar:
            try:
                Estudante.objects.bulk_create(alunos_para_salvar)
                self.stdout.write(self.style.SUCCESS(f"-> SUCESSO! {len(alunos_para_salvar)} estudantes inseridos com sucesso na model Estudantes."))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Erro fatal ao salvar no banco de dados: {str(e)}"))
        else:
            self.stdout.write(self.style.ERROR("Nenhum estudante foi preparado para salvar."))
