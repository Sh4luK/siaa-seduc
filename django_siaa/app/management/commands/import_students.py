import os
import json
from pathlib import Path
from django.core.management.base import BaseCommand
from app.models import Estudante


class Command(BaseCommand):
    help = 'Importa e cadastra estudantes na model Estudante a partir de arquivo JSON'

    def add_arguments(self, parser):
        parser.add_argument(
            '--arquivo',
            type=str,
            default=None,
            help='Caminho do arquivo JSON de estudantes (padrão: alunosExportados.json)'
        )
        parser.add_argument(
            '--limpar',
            action='store_true',
            help='Limpa todos os estudantes existentes antes de importar'
        )

    def handle(self, *args, **options):
        caminho_informado = options.get('arquivo')

        if caminho_informado:
            json_path = Path(caminho_informado).resolve()
        else:
            # Tenta encontrar alunosExportados.json primeiro, depois alunos_formatados.json
            possiveis = [
                Path('alunosExportados.json'),
                Path('django_siaa/alunosExportados.json'),
                Path('../infra/alunos_formatados.json'),
                Path('infra/alunos_formatados.json'),
            ]
            json_path = None
            for p in possiveis:
                if p.exists():
                    json_path = p.resolve()
                    break

        if not json_path or not json_path.exists():
            self.stdout.write(self.style.ERROR(f"ERRO: Arquivo JSON não encontrado."))
            return

        self.stdout.write(self.style.SUCCESS(f"-> Lendo arquivo: {json_path}"))

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                dados = json.load(f)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro crítico ao ler/decodificar o JSON: {str(e)}"))
            return

        if options.get('limpar'):
            removidos, _ = Estudante.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"-> {removidos} registros anteriores removidos."))

        alunos_para_salvar = []

        if isinstance(dados, list):
            # Formato lista direta (ex: alunosExportados.json)
            for item in dados:
                alunos_para_salvar.append(
                    Estudante(
                        id=item.get('id'),
                        posicao_ordem=item.get('posicao_ordem'),
                        nome_completo=item.get('nome_completo'),
                        escola=item.get('escola'),
                        modo_de_ensino=item.get('modo_de_ensino'),
                        serie=item.get('serie'),
                        periodo=item.get('periodo'),
                        curso=item.get('curso'),
                        turma=item.get('turma'),
                        senha=item.get('senha', '12345678'),
                        ip=item.get('ip')
                    )
                )
        elif isinstance(dados, dict):
            # Formato agrupado por páginas (ex: alunos_formatados.json)
            for pagina_id, conteudo_pagina in dados.items():
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

        self.stdout.write(self.style.WARNING(f"-> Total de alunos preparados: {len(alunos_para_salvar)}"))

        if alunos_para_salvar:
            try:
                Estudante.objects.bulk_create(alunos_para_salvar)
                self.stdout.write(self.style.SUCCESS(f"-> SUCESSO! {len(alunos_para_salvar)} estudantes inseridos na model Estudante."))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Erro fatal ao salvar no banco de dados: {str(e)}"))
        else:
            self.stdout.write(self.style.ERROR("Nenhum estudante foi preparado para salvar."))
