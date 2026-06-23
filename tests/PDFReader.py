import pypdf
import json

def pdf_para_json(caminho_pdf, caminho_json):
    dados_pdf = {}
    
    with open(caminho_pdf, 'rb') as arquivo:
        leitor = pypdf.PdfReader(arquivo)
        
        for i, pagina in enumerate(leitor.pages):
            texto = pagina.extract_text()
            dados_pdf[f"Pagina_{i + 1}"] = texto
            
    with open(caminho_json, 'w', encoding='utf-8') as arquivo_json:
        json.dump(dados_pdf, arquivo_json, indent=4, ensure_ascii=False)

pdf_para_json('turmasCalistoLobo.pdf', 'dados.json')
