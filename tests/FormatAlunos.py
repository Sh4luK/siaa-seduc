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
                modo_ensino = re.search(r"ENSINO MEDIO TECNICO PROFISSIONAL", texto).group(0).strip()
                periodo = re.search(r"PERÍODO\s+([^\n]+)", texto).group(1).strip()
                
                curso_cru = re.search(r"CURSO\s+([^\n]+)", texto).group(1).strip()
                curso = re.sub(r"^CURSO\s+", "", curso_cru)

                linha_turma = re.search(r"([A-Z0-9\-ª\s]+1ª SERIE - INTEGRAL TURMA)", texto).group(1)
                serie = "1ª SERIE - INTEGRAL"
                turma = linha_turma.replace(serie + " TURMA", "").strip()

                alunos = []
                linhas_alunos = re.findall(r"^(\d+)\s+([A-ZÁÉÍÓÚÂÊÔÇ ]+?)\s*$", texto, re.MULTILINE)

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
                
            except AttributeError:
                print(f"-> Aviso: A estrutura da {chave_pagina} não corresponde ao padrão esperado e foi ignorada.")
                
    with open(caminho_json, 'w', encoding='utf-8') as arquivo_json:
        json.dump(resultado_final, arquivo_json, indent=4, ensure_ascii=False)
        
    print(f"\nProcesso concluído! O arquivo foi salvo em: '{caminho_json}'")

caminho_entrada = "turmasCalistoLobo.pdf"
caminho_saida = "alunos_formatados.json"

extrair_e_formatar_pdf(caminho_entrada, caminho_saida)
