import pandas as pd
import json

nome_arquivo = 'LISTAGEM DE DISCIPLINAS POR CURSO-TURMA-PROFESSOR__.xlsx'
df = pd.read_excel(nome_arquivo)

linha_cabecalho = None
for i in range(min(15, len(df))):
    valores_linha = df.iloc[i].astype(str).str.upper().str.strip().tolist()
    if 'GRE' in valores_linha or 'ESCOLA' in valores_linha:
        linha_cabecalho = i
        break

if linha_cabecalho is not None:
    df = pd.read_excel(nome_arquivo, skiprows=linha_cabecalho + 1)

df.columns = df.columns.astype(str).str.upper().str.strip()
df.columns = df.columns.str.normalize('NFKD').str.encode('ascii', errors='ignore').str.decode('utf-8')

colunas_desejadas = [
    'GRE', 'CATEGORIA DA MODALIDADE', 'MUNICIPIO', 'ESCOLA',
    'MODALIDADE DE ENSINO', 'TURMA', 'ETAPA', 'DISCIPLINA', 'PROFESSOR'
]

colunas_existentes = [c for c in colunas_desejadas if c in df.columns]
df_filtrado = df[colunas_existentes].copy()

for col in df_filtrado.columns:
    df_filtrado[col] = df_filtrado[col].astype(str).str.replace(r'[\r\n\t]+', ' ', regex=True).str.strip()

df_filtrado = df_filtrado.replace(['nan', 'None', '<NA>', ''], None)
df_filtrado = df_filtrado.ffill()

correcoes_disciplinas = {
    'PERCURSO DE': 'PERCURSOS DE APROFUNDAMENTO',
    'PERCURSOS DE': 'PERCURSOS DE APROFUNDAMENTO',
    'PERCURSO': 'PERCURSOS DE APROFUNDAMENTO'
}

df_filtrado['DISCIPLINA'] = df_filtrado['DISCIPLINA'].str.upper().str.strip()
df_filtrado['DISCIPLINA'] = df_filtrado['DISCIPLINA'].replace(correcoes_disciplinas)

df_filtrado = df_filtrado[df_filtrado['PROFESSOR'].notna()]
termo_filtro = df_filtrado['PROFESSOR'].str.upper()
df_filtrado = df_filtrado[~termo_filtro.str.contains('TOTAL', na=False)]

resultado_agrupado = []

# Iteração corrigida por professor
for professor, dados_professor in df_filtrado.groupby('PROFESSOR'):
    
    lista_disciplinas_global = dados_professor['DISCIPLINA'].dropna().unique().tolist()
    lista_disciplinas_global = [d for d in lista_disciplinas_global if d and str(d).upper() != 'NONE']
    
    # Dicionário auxiliar para unificar as salas e coletar as disciplinas sem dar KeyError
    salas_dict = {}
    
    for linha in dados_professor.to_dict(orient='records'):
        escola_val = linha.get('ESCOLA')
        turma_val = linha.get('TURMA')
        etapa_val = linha.get('ETAPA')
        disciplina_linha = linha.get('DISCIPLINA')
        
        # Ignora linhas totalmente nulas de turma ou escola
        if not escola_val or not turma_val:
            continue
            
        escola_key = str(escola_val).strip().upper()
        turma_key = str(turma_val).strip().upper()
        
        # Cria a chave composta para agrupar as disciplinas daquela sala específica
        chave_composta_sala = f"{escola_key}||{turma_key}"
        
        if chave_composta_sala not in salas_dict:
            # FORMATO SOLICITADO: Apenas ESCOLA, TURMA, ETAPA e a lista DISCIPLINA_DADA
            salas_dict[chave_composta_sala] = {
                "ESCOLA": escola_key,
                "TURMA": turma_key,
                "ETAPA": str(etapa_val).strip().upper() if etapa_val else "NÃO INFORMADA",
                "DISCIPLINA_DADA": []
            }
            
        # Adiciona a disciplina na lista se for válida e não estiver repetida na mesma sala
        if disciplina_linha and str(disciplina_linha).upper() != 'NONE':
            disciplina_formatada = str(disciplina_linha).strip().upper()
            if disciplina_formatada not in salas_dict[chave_composta_sala]["DISCIPLINA_DADA"]:
                salas_dict[chave_composta_sala]["DISCIPLINA_DADA"].append(disciplina_formatada)

    # Converte o agrupamento das salas em uma lista limpa
    historico_atividades = list(salas_dict.values())
    
    resultado_agrupado.append({
        "PROFESSOR": professor,
        "DISCIPLINA": lista_disciplinas_global,
        "ATRAVESSA_POR": historico_atividades
    })

with open('dados_escolas.json', 'w', encoding='utf-8') as f:
    json.dump(resultado_agrupado, f, ensure_ascii=False, indent=4)

print("\nConversão finalizada com sucesso!")
print("JSON gerado no formato solicitado com 'DISCIPLINA_DADA' em formato de array.")
