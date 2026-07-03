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

for professor, dados_professor in df_filtrado.groupby('PROFESSOR'):
    
    lista_disciplinas = dados_professor['DISCIPLINA'].dropna().unique().tolist()
    lista_disciplinas = [d for d in lista_disciplinas if d and str(d).upper() != 'NONE']
    
    colunas_historico = [c for c in dados_professor.columns if c not in ['PROFESSOR', 'DISCIPLINA']]
    historico_atividades = dados_professor[colunas_historico].to_dict(orient='records')
    
    resultado_agrupado.append({
        "PROFESSOR": professor,
        "DISCIPLINA": lista_disciplinas,
        "ATRAVESSA_POR": historico_atividades
    })

with open('dados_escolas.json', 'w', encoding='utf-8') as f:
    json.dump(resultado_agrupado, f, ensure_ascii=False, indent=4)

print("\nConversão finalizada com sucesso!")
print("A disciplina 'PERCURSO DE' foi forçada para o nome correto por extenso no JSON.")
