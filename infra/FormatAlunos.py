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
                escola_match = re.search(r"\d+ - CETI\s+[^\n]+", texto)
                escola = escola_match.group(0).strip() if escola_match else "CETI CALISTO LOBO"
                
                periodo = "2026/1"
                match_p = re.search(r"(202\d/\d)", texto)
                if match_p: 
                    periodo = match_p.group(1)
                
                modo_ensino = "ENSINO MEDIO TECNICO PROFISSIONAL"

                match_turma_codigo = re.search(r"([A-Z0-9\-]+\s*-\s*\d[ªa]??\s*SERIE\s*-\s*INTEGRAL\s*-\s*I\s*-\s*[A-Z])", texto, re.IGNORECASE)
                
                if match_turma_codigo:
                    turma_crua = match_turma_codigo.group(1).strip().upper()
                    turma_limpa = re.sub(r'\s*-\s*', '-', turma_crua)
                    turma_limpa = re.sub(r'(\d)[ÂÃA]??ª??-??SERIE-INTEGRAL', r'\1ª SERIE - INTEGRAL', turma_limpa)
                    turma = turma_limpa
                else:
                    turma = "EMTPADM-ENF-EMP-1ª SERIE - INTEGRAL-I-A"

                texto_corrido = texto.replace('\n', ' ').replace('\r', ' ')
                texto_corrido = re.sub(r'\s+', ' ', texto_corrido).upper()
                
                match_curso_texto = re.search(r"(T[ÉE]CNICO\s+EM\s+[A-ZÁÉÍÓÚÂÊÔÇÃÕÀÈÌÒÙ ]+)", texto_corrido, re.IGNORECASE)
                
                if match_curso_texto:
                    curso_limpo = match_curso_texto.group(1).strip()
                    
                    curso_limpo = re.split(r'\s+COM\s+|\s+EMTP|\s+\d[ªA]', curso_limpo)[0].strip()
                    
                    correcoes_acentos = {'É': 'E', 'Ó': 'O', 'Í': 'I', 'Ú': 'U', 'Á': 'A', 'Ç': 'C', 'Ã': 'A', 'Õ': 'O', 'Â': 'A', 'Ê': 'E', 'Ô': 'O'}
                    for caractere, substituto in correcoes_acentos.items():
                        curso_limpo = curso_limpo.replace(caractere, substituto)
                    curso = curso_limpo
                else:
                    if "ADMINISTRA" in texto_corrido:
                        curso = "TECNICO EM ADMINISTRACAO"
                    elif "SISTEMA" in texto_corrido or "DESENVOLVIMENTO" in texto_corrido:
                        curso = "TECNICO EM DESENVOLVIMENTO DE SISTEMAS"
                    else:
                        curso = "TECNICO EM ADMINISTRACAO"

                match_serie = re.search(r"(\d)[ªaÂÃ]??\s*SERIE", texto, re.IGNORECASE)
                serie = f"{match_serie.group(1)}ª SERIE - INTEGRAL" if match_serie else "1ª SERIE - INTEGRAL"

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

caminho_entrada = "turmasCalistoLobo.pdf"
caminho_saida = "alunos_formatados.json"

extrair_e_formatar_pdf(caminho_entrada, caminho_saida)
