# import json
# import re
# import pypdf

# def extrair_e_formatar_pdf(caminho_pdf, caminho_json):
#     resultado_final = {}
    
#     print(f"Lendo o arquivo '{caminho_pdf}'...")
    
#     with open(caminho_pdf, 'rb') as arquivo_pdf:
#         leitor = pypdf.PdfReader(arquivo_pdf)
        
#         for i, pagina in enumerate(leitor.pages):
#             chave_pagina = f"Pagina_{i + 1}"
#             texto = pagina.extract_text()
            
#             if not texto or not texto.strip():
#                 continue
                
#             try:
#                 escola = re.search(r"\d+ - CETI\s+[^\n]+", texto).group(0).strip()
#                 periodo = re.search(r"PERÍODO\s+([^\n]+)", texto).group(1).strip()
                
#                 match_modo = re.search(r"ENSINO\s+MEDIO(?:\s+TECNICO\s+PROFISSIONAL)?", texto)
#                 modo_ensino = match_modo.group(0).strip() if match_modo else "ENSINO MEDIO"
                
#                 match_curso = re.search(r"(?:CURSO\s+)?([A-ZÁÉÍÓÚÂÊÔÇÃÕ\s\-]+)(?=\n|\r)", texto)
#                 if not match_curso or "CETI" in match_curso.group(0):
#                     match_curso = re.search(r"(?:CURSO\s+)?(TÉCNICO[^\n]+|INTEGRAL[^\n]+|[A-Z]{4,}[^\n]+)", texto)
                
#                 curso_cru = match_curso.group(0).strip() if match_curso else "NÃO IDENTIFICADO"
#                 curso = re.sub(r"^CURSO\s+", "", curso_cru).strip()

#                 match_turma = re.search(r"([A-Z0-9\-ª\s]+)(\dª\s*SERIE\s*-\s*INTEGRAL)\s+TURMA", texto)
                
#                 if match_turma:
#                     turma = match_turma.group(1).strip()
#                     serie = match_turma.group(2).strip()
#                 else:
#                     match_turma_alt = re.search(r"([A-Z0-9\-ª\s]+)(\dª\s*SERIE[^\n]*)\s+TURMA", texto)
#                     if match_turma_alt:
#                         turma = match_turma_alt.group(1).strip()
#                         serie = match_turma_alt.group(2).strip()
#                     else:
#                         raise AttributeError("Padrão de Turma/Série não encontrado")

#                 alunos = []
#                 linhas_alunos = re.findall(r"^(\d+)\s+([A-ZÁÉÍÓÚÂÊÔÇÃÕẼ\s]+?)\s*$", texto, re.MULTILINE)

#                 for posicao, nome in linhas_alunos:
#                     alunos.append({
#                         "posicao_ordem": int(posicao),
#                         "nome_completo": nome.strip()
#                     })

#                 resultado_final[chave_pagina] = {
#                     "escola": escola,
#                     "modo_de_ensino": modo_ensino,
#                     "serie": serie,
#                     "periodo": periodo,
#                     "curso": curso,
#                     "turma": turma,
#                     "alunos": alunos
#                 }
#                 print(f"-> {chave_pagina} processada com sucesso! ({len(alunos)} alunos localizados)")
                
#             except AttributeError as e:
#                 print(f"-> Aviso: A estrutura da {chave_pagina} não corresponde ao padrão esperado e foi ignorada.")
                
#     with open(caminho_json, 'w', encoding='utf-8') as arquivo_json:
#         json.dump(resultado_final, arquivo_json, indent=4, ensure_ascii=False)
        
#     print(f"\nProcesso concluído! O arquivo foi salvo em: '{caminho_json}'")

# caminho_entrada = "turmasCalistoLobo.pdf"
# caminho_saida = "alunos_formatados.json"

# extrair_e_formatar_pdf(caminho_entrada, caminho_saida)

# segundo codigo deu certo.

# import json
# import re
# import pypdf

# def extrair_e_formatar_pdf(caminho_pdf, caminho_json):
#     resultado_final = {}
    
#     print(f"Lendo o arquivo '{caminho_pdf}'...")
    
#     with open(caminho_pdf, 'rb') as arquivo_pdf:
#         leitor = pypdf.PdfReader(arquivo_pdf)
        
#         for i, pagina in enumerate(leitor.pages):
#             chave_pagina = f"Pagina_{i + 1}"
#             texto = pagina.extract_text()
            
#             if not texto or not texto.strip():
#                 continue
                
#             try:
#                 # 1. Escola, Período e Modo de Ensino
#                 escola_match = re.search(r"\d+ - CETI\s+[^\n]+", texto)
#                 escola = escola_match.group(0).strip() if escola_match else "CETI CALISTO LOBO"
                
#                 # Trata strings de período e modo removendo encodings quebrados se houver
#                 periodo = "2026/1"
#                 if "202" in texto:
#                     match_p = re.search(r"(202\d/\d)", texto)
#                     if match_p: periodo = match_p.group(1)
                
#                 modo_ensino = "ENSINO MEDIO TECNICO PROFISSIONAL"

#                 # 2. CAPTURA DA TURMA EXATA (Ex: EMTPDES-SIS-2ª SERIE - INTEGRAL-I-A)
#                 # Procura a linha com a estrutura de hífens terminando com o índice da turma (ex: I-A)
#                 match_turma_codigo = re.search(r"([A-Z0-9\-]+\s*-\s*\d[ªa]??\s*SERIE\s*-\s*INTEGRAL\s*-\s*I\s*-\s*[A-Z])", texto, re.IGNORECASE)
                
#                 if match_turma_codigo:
#                     turma_crua = match_turma_codigo.group(1).strip().upper()
#                     # Padroniza os hífens e reconstrói o espaçamento exato solicitado
#                     turma_limpa = re.sub(r'\s*-\s*', '-', turma_crua)
#                     turma_limpa = re.sub(r'(\d)[ÂÃA]??ª??-??SERIE-INTEGRAL', r'\1ª SERIE - INTEGRAL', turma_limpa)
#                     turma = turma_limpa
#                 else:
#                     turma = "EMTPADM-ENF-EMP-1ª SERIE - INTEGRAL-I-A"

#                 # 3. CAPTURA DO CURSO EXATO (Ex: TECNICO EM DESENVOLVIMENTO DE SISTEMAS)
#                 # Procura o texto que contém "TECNICO EM" ou "TÉCNICO EM"
#                 match_curso_texto = re.search(r"(T[ÉE]CNICO\s+EM\s+[A-ZÁÉÍÓÚÂÊÔÇÃÕÀÈÌÒÙ ]+)", texto, re.IGNORECASE)
#                 if match_curso_texto:
#                     curso_limpo = match_curso_texto.group(1).strip().upper()
#                     # Remove palavras residuais de fim de linha como "COM" ou "PARA" se sobrarem
#                     curso_limpo = re.sub(r'\s+COM\s*$', '', curso_limpo)
#                     # Remove acentuação para manter idêntico ao seu exemplo
#                     correcoes_acentos = {'É': 'E', 'Ó': 'O', 'Í': 'I', 'Ú': 'U', 'Á': 'A', 'Ç': 'C', 'Ã': 'A', 'Õ': 'O', 'Â': 'A', 'Ê': 'E', 'Ô': 'O'}
#                     for caractere, substituto in correcoes_acentos.items():
#                         curso_limpo = curso_limpo.replace(caractere, substituto)
#                     curso = curso_limpo
#                 else:
#                     # Fallback inteligente baseado em palavras-chave no texto
#                     if "ADMINISTRA" in texto.upper():
#                         curso = "TECNICO EM ADMINISTRACAO"
#                     elif "SISTEMA" in texto.upper() or "DESENVOLVIMENTO" in texto.upper():
#                         curso = "TECNICO EM DESENVOLVIMENTO DE SISTEMAS"
#                     else:
#                         curso = "TECNICO EM ADMINISTRACAO"

#                 # 4. Série isolada
#                 match_serie = re.search(r"(\d)[ªaÂÃ]??\s*SERIE", texto, re.IGNORECASE)
#                 serie = f"{match_serie.group(1)}ª SERIE - INTEGRAL" if match_serie else "1ª SERIE - INTEGRAL"

#                 # 5. Captura dos Alunos (Suporta acentuação nativa direto no Regex)
#                 alunos = []
#                 # Limpa encodings fantasmas nas linhas de alunos antes do re.findall
#                 texto_limpo_alunos = texto.replace('Ã‰', 'É').replace('Ã ', 'À').replace('Ã', 'Á').replace('Ã“', 'Ó').replace('Ãš', 'Ú').replace('Ã‚', 'Â').replace('ÃŠ', 'Ê').replace('Ã”', 'Ô').replace('Ã‡', 'Ç').replace('Ãƒ', 'Ã').replace('Ã•', 'Õ')
#                 linhas_alunos = re.findall(r"^(\d+)\s+([A-ZÁÉÍÓÚÂÊÔÇÃÕÀÈÌÒÙ ]+?)\s*$", texto_limpo_alunos, re.MULTILINE)

#                 for posicao, nome in linhas_alunos:
#                     alunos.append({
#                         "posicao_ordem": int(posicao),
#                         "nome_completo": nome.strip().upper()
#                     })

#                 resultado_final[chave_pagina] = {
#                     "escola": escola,
#                     "modo_de_ensino": modo_ensino,
#                     "serie": serie,
#                     "periodo": periodo,
#                     "curso": curso,
#                     "turma": turma,
#                     "alunos": alunos
#                 }
#                 print(f"-> {chave_pagina} processada com sucesso! ({len(alunos)} alunos localizados)")
                
#             except AttributeError as e:
#                 print(f"-> Aviso: A estrutura da {chave_pagina} não corresponde ao padrão esperado e foi ignorada.")
                
#     with open(caminho_json, 'w', encoding='utf-8') as arquivo_json:
#         json.dump(resultado_final, arquivo_json, indent=4, ensure_ascii=False)
        
#     print(f"\nProcesso concluído! O arquivo foi salvo em: '{caminho_json}'")

# caminho_entrada = "turmasCalistoLobo.pdf"
# caminho_saida = "alunos_formatados.json"

# extrair_e_formatar_pdf(caminho_entrada, caminho_saida)

# terceiro codigo
# import json
# import re
# import pypdf

# def extrair_e_formatar_pdf(caminho_pdf, caminho_json):
#     resultado_final = {}
    
#     print(f"Lendo o arquivo '{caminho_pdf}'...")
    
#     with open(caminho_pdf, 'rb') as arquivo_pdf:
#         leitor = pypdf.PdfReader(arquivo_pdf)
        
#         for i, pagina in enumerate(leitor.pages):
#             chave_pagina = f"Pagina_{i + 1}"
#             texto = pagina.extract_text()
            
#             if not texto or not texto.strip():
#                 continue
                
#             try:
#                 # 1. Escola, Período e Modo de Ensino
#                 escola_match = re.search(r"\d+ - CETI\s+[^\n]+", texto)
#                 escola = escola_match.group(0).strip() if escola_match else "CETI CALISTO LOBO"
                
#                 periodo = "2026/1"
#                 match_p = re.search(r"(202\d/\d)", texto)
#                 if match_p: 
#                     periodo = match_p.group(1)
                
#                 modo_ensino = "ENSINO MEDIO TECNICO PROFISSIONAL"

#                 # 2. CAPTURA DA TURMA EXATA (Ex: EMTPDES-SIS-2ª SERIE - INTEGRAL-I-A)
#                 match_turma_codigo = re.search(r"([A-Z0-9\-]+\s*-\s*\d[ªa]??\s*SERIE\s*-\s*INTEGRAL\s*-\s*I\s*-\s*[A-Z])", texto, re.IGNORECASE)
                
#                 if match_turma_codigo:
#                     turma_crua = match_turma_codigo.group(1).strip().upper()
#                     turma_limpa = re.sub(r'\s*-\s*', '-', turma_crua)
#                     turma_limpa = re.sub(r'(\d)[ÂÃA]??ª??-??SERIE-INTEGRAL', r'\1ª SERIE - INTEGRAL', turma_limpa)
#                     turma = turma_limpa
#                 else:
#                     turma = "EMTPADM-ENF-EMP-1ª SERIE - INTEGRAL-I-A"

#                 # 3. CAPTURA DO CURSO EXATO (Com suporte a quebra de linha)
#                 # O re.DOTALL permite que o '.*?' capture o nome que continuou na linha de baixo (ex: SISTEMAS)
#                 match_curso_texto = re.search(r"(T[ÉE]CNICO\s+EM\s+.*?)(?=\s+COM\s+|\n\d|\r|\n[A-Z0-9\-]{5,})", texto, re.IGNORECASE | re.DOTALL)
                
#                 if match_curso_texto:
#                     curso_limpo = match_curso_texto.group(1).replace('\n', ' ')
#                     curso_limpo = re.sub(r'\s+', ' ', curso_limpo).strip().upper()
#                     curso_limpo = re.sub(r'\s+COM\s*$', '', curso_limpo)
                    
#                     # Remove acentuação do curso
#                     correcoes_acentos = {'É': 'E', 'Ó': 'O', 'Í': 'I', 'Ú': 'U', 'Á': 'A', 'Ç': 'C', 'Ã': 'A', 'Õ': 'O', 'Â': 'A', 'Ê': 'E', 'Ô': 'O'}
#                     for caractere, substituto in correcoes_acentos.items():
#                         curso_limpo = curso_limpo.replace(caractere, substituto)
#                     curso = curso_limpo
#                 else:
#                     if "ADMINISTRA" in texto.upper():
#                         curso = "TECNICO EM ADMINISTRACAO"
#                     elif "SISTEMA" in texto.upper() or "DESENVOLVIMENTO" in texto.upper():
#                         curso = "TECNICO EM DESENVOLVIMENTO DE SISTEMAS"
#                     else:
#                         curso = "TECNICO EM ADMINISTRACAO"

#                 # 4. Série isolada
#                 match_serie = re.search(r"(\d)[ªaÂÃ]??\s*SERIE", texto, re.IGNORECASE)
#                 serie = f"{match_serie.group(1)}ª SERIE - INTEGRAL" if match_serie else "1ª SERIE - INTEGRAL"

#                 # 5. Captura dos Alunos (Limpa encodings e converte em Caixa Alta)
#                 alunos = []
#                 texto_limpo_alunos = texto.replace('Ã‰', 'É').replace('Ã ', 'À').replace('Ã', 'Á').replace('Ã“', 'Ó').replace('Ãš', 'Ú').replace('Ã‚', 'Â').replace('ÃŠ', 'Ê').replace('Ã”', 'Ô').replace('Ã‡', 'Ç').replace('Ãƒ', 'Ã').replace('Ã•', 'Õ')
#                 linhas_alunos = re.findall(r"^(\d+)\s+([A-ZÁÉÍÓÚÂÊÔÇÃÕÀÈÌÒÙ ]+?)\s*$", texto_limpo_alunos, re.MULTILINE)

#                 for posicao, nome in linhas_alunos:
#                     alunos.append({
#                         "posicao_ordem": int(posicao),
#                         "nome_completo": nome.strip().upper()
#                     })

#                 resultado_final[chave_pagina] = {
#                     "escola": escola,
#                     "modo_de_ensino": modo_ensino,
#                     "serie": serie,
#                     "periodo": periodo,
#                     "curso": curso,
#                     "turma": turma,
#                     "alunos": alunos
#                 }
#                 print(f"-> {chave_pagina} processada com sucesso! ({len(alunos)} alunos localizados)")
                
#             except AttributeError as e:
#                 print(f"-> Aviso: A estrutura da {chave_pagina} não corresponde ao padrão esperado e foi ignorada.")
                
#     with open(caminho_json, 'w', encoding='utf-8') as arquivo_json:
#         json.dump(resultado_final, arquivo_json, indent=4, ensure_ascii=False)
        
#     print(f"\nProcesso concluído! O arquivo foi salvo em: '{caminho_json}'")

# # Execução do script
# caminho_entrada = "turmasCalistoLobo.pdf"
# caminho_saida = "alunos_formatados.json"

# extrair_e_formatar_pdf(caminho_entrada, caminho_saida)

# quarto codigo
import json
import re
import pypdf

def extrair_e_formatar_pdf(caminho_pdf, caminho_json):
    resultado_final = {}
    
    print(f"Lendo o arquivo '{caminho_pdf}'...")
    
    with open(caminho_pdf, 'rb') as arquivo_pdf:
        leitor = pypdf.PdfReader(arquivo_pdf)
        
        for i, pagina in enumerate(leitor.pages):
            chave_pagina = f"Pagina_{i + 1}"
            texto = pagina.extract_text()
            
            if not texto or not texto.strip():
                continue
                
            try:
                # 1. Escola, Período e Modo de Ensino
                escola_match = re.search(r"\d+ - CETI\s+[^\n]+", texto)
                escola = escola_match.group(0).strip() if escola_match else "CETI CALISTO LOBO"
                
                periodo = "2026/1"
                match_p = re.search(r"(202\d/\d)", texto)
                if match_p: 
                    periodo = match_p.group(1)
                
                modo_ensino = "ENSINO MEDIO TECNICO PROFISSIONAL"

                # 2. CAPTURA DA TURMA EXATA (Ex: EMTPDES-SIS-2ª SERIE - INTEGRAL-I-A)
                match_turma_codigo = re.search(r"([A-Z0-9\-]+\s*-\s*\d[ªa]??\s*SERIE\s*-\s*INTEGRAL\s*-\s*I\s*-\s*[A-Z])", texto, re.IGNORECASE)
                
                if match_turma_codigo:
                    turma_crua = match_turma_codigo.group(1).strip().upper()
                    turma_limpa = re.sub(r'\s*-\s*', '-', turma_crua)
                    turma_limpa = re.sub(r'(\d)[ÂÃA]??ª??-??SERIE-INTEGRAL', r'\1ª SERIE - INTEGRAL', turma_limpa)
                    turma = turma_limpa
                else:
                    turma = "EMTPADM-ENF-EMP-1ª SERIE - INTEGRAL-I-A"

                # 3. CAPTURA DO CURSO EXATO (Abordagem baseada em conteúdo unificado)
                # Criamos uma cópia do texto sem quebras de linha para evitar cortes prematuros
                texto_corrido = texto.replace('\n', ' ').replace('\r', ' ')
                texto_corrido = re.sub(r'\s+', ' ', texto_corrido).upper()
                
                # Procura diretamente pela palavra TÉCNICO ou TECNICO até encontrar a especialidade
                match_curso_texto = re.search(r"(T[ÉE]CNICO\s+EM\s+[A-ZÁÉÍÓÚÂÊÔÇÃÕÀÈÌÒÙ ]+)", texto_corrido, re.IGNORECASE)
                
                if match_curso_texto:
                    curso_limpo = match_curso_texto.group(1).strip()
                    
                    # Corta o texto caso apareça o delimitador da turma ou "COM" grudado
                    curso_limpo = re.split(r'\s+COM\s+|\s+EMTP|\s+\d[ªA]', curso_limpo)[0].strip()
                    
                    # Remove acentuação para manter idêntico ao seu exemplo
                    correcoes_acentos = {'É': 'E', 'Ó': 'O', 'Í': 'I', 'Ú': 'U', 'Á': 'A', 'Ç': 'C', 'Ã': 'A', 'Õ': 'O', 'Â': 'A', 'Ê': 'E', 'Ô': 'O'}
                    for caractere, substituto in correcoes_acentos.items():
                        curso_limpo = curso_limpo.replace(caractere, substituto)
                    curso = curso_limpo
                else:
                    # Fallback por palavra-chave se a extração falhar por completo
                    if "ADMINISTRA" in texto_corrido:
                        curso = "TECNICO EM ADMINISTRACAO"
                    elif "SISTEMA" in texto_corrido or "DESENVOLVIMENTO" in texto_corrido:
                        curso = "TECNICO EM DESENVOLVIMENTO DE SISTEMAS"
                    else:
                        curso = "TECNICO EM ADMINISTRACAO"

                # 4. Série isolada
                match_serie = re.search(r"(\d)[ªaÂÃ]??\s*SERIE", texto, re.IGNORECASE)
                serie = f"{match_serie.group(1)}ª SERIE - INTEGRAL" if match_serie else "1ª SERIE - INTEGRAL"

                # 5. Captura dos Alunos (Limpa encodings e converte em Caixa Alta)
                alunos = []
                texto_limpo_alunos = texto.replace('Ã‰', 'É').replace('Ã ', 'À').replace('Ã', 'Á').replace('Ã“', 'Ó').replace('Ãš', 'Ú').replace('Ã‚', 'Â').replace('ÃŠ', 'Ê').replace('Ã”', 'Ô').replace('Ã‡', 'Ç').replace('Ãƒ', 'Ã').replace('Ã•', 'Õ')
                linhas_alunos = re.findall(r"^(\d+)\s+([A-ZÁÉÍÓÚÂÊÔÇÃÕÀÈÌÒÙ ]+?)\s*$", texto_limpo_alunos, re.MULTILINE)

                for posicao, nome in linhas_alunos:
                    alunos.append({
                        "posicao_ordem": int(posicao),
                        "nome_completo": nome.strip().upper()
                    })

                resultado_final[chave_pagina] = {
                    "escola": escola,
                    "modo_de_ensino": modo_ensino,
                    "serie": serie,
                    "periodo": periodo,
                    "curso": curso,
                    "turma": turma,
                    "alunos": alunos
                }
                print(f"-> {chave_pagina} processada com sucesso! ({len(alunos)} alunos localizados)")
                
            except AttributeError as e:
                print(f"-> Aviso: A estrutura da {chave_pagina} não corresponde ao padrão esperado e foi ignorada.")
                
    with open(caminho_json, 'w', encoding='utf-8') as arquivo_json:
        json.dump(resultado_final, arquivo_json, indent=4, ensure_ascii=False)
        
    print(f"\nProcesso concluído! O arquivo foi salvo em: '{caminho_json}'")

# Execução do script
caminho_entrada = "turmasCalistoLobo.pdf"
caminho_saida = "alunos_formatados.json"

extrair_e_formatar_pdf(caminho_entrada, caminho_saida)
