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
                escola = re.search(r"\d+ - CETI\s+[^\n]+", texto).group(0).strip()
                periodo = re.search(r"PERÍODO\s+([^\n]+)", texto).group(1).strip()
                
                match_modo = re.search(r"ENSINO\s+MEDIO(?:\s+TECNICO\s+PROFISSIONAL)?", texto)
                modo_ensino = match_modo.group(0).strip() if match_modo else "ENSINO MEDIO"
                
                match_curso = re.search(r"(?:CURSO\s+)?([A-ZÁÉÍÓÚÂÊÔÇÃÕ\s\-]+)(?=\n|\r)", texto)
                if not match_curso or "CETI" in match_curso.group(0):
                    match_curso = re.search(r"(?:CURSO\s+)?(TÉCNICO[^\n]+|INTEGRAL[^\n]+|[A-Z]{4,}[^\n]+)", texto)
                
                curso_cru = match_curso.group(0).strip() if match_curso else "NÃO IDENTIFICADO"
                curso = re.sub(r"^CURSO\s+", "", curso_cru).strip()

                match_turma = re.search(r"([A-Z0-9\-ª\s]+)(\dª\s*SERIE\s*-\s*INTEGRAL)\s+TURMA", texto)
                
                if match_turma:
                    turma = match_turma.group(1).strip()
                    serie = match_turma.group(2).strip()
                else:
                    match_turma_alt = re.search(r"([A-Z0-9\-ª\s]+)(\dª\s*SERIE[^\n]*)\s+TURMA", texto)
                    if match_turma_alt:
                        turma = match_turma_alt.group(1).strip()
                        serie = match_turma_alt.group(2).strip()
                    else:
                        raise AttributeError("Padrão de Turma/Série não encontrado")

                alunos = []
                linhas_alunos = re.findall(r"^(\d+)\s+([A-ZÁÉÍÓÚÂÊÔÇÃÕẼ\s]+?)\s*$", texto, re.MULTILINE)

                for posicao, nome in linhas_alunos:
                    alunos.append({
                        "posicao_ordem": int(posicao),
                        "nome_completo": nome.strip()
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
