"""
import pandas as pd
import json

# 1. Carregar o arquivo Excel
nome_arquivo = 'LISTAGEM DE DISCIPLINAS POR CURSO-TURMA-PROFESSOR__.xlsx'
df = pd.read_excel(nome_arquivo)

# 2. Localizar a linha correta do cabeçalho automaticamente
linha_cabecalho = None
for i in range(min(15, len(df))):
    valores_linha = df.iloc[i].astype(str).str.upper().str.strip().tolist()
    if 'GRE' in valores_linha or 'ESCOLA' in valores_linha:
        linha_cabecalho = i
        break

if linha_cabecalho is not None:
    df = pd.read_excel(nome_arquivo, skiprows=linha_cabecalho + 1)

# 3. Padronizar e limpar os nomes das colunas
df.columns = df.columns.astype(str).str.upper().str.strip()
df.columns = df.columns.str.normalize('NFKD').str.encode('ascii', errors='ignore').str.decode('utf-8')

# Definir colunas desejadas
colunas_desejadas = [
    'GRE', 'CATEGORIA DA MODALIDADE', 'MUNICIPIO', 'ESCOLA',
    'MODALIDADE DE ENSINO', 'TURMA', 'ETAPA', 'DISCIPLINA', 'PROFESSOR'
]

colunas_existentes = [c for c in colunas_desejadas if c in df.columns]
df_filtrado = df[colunas_existentes].copy()

# 4. Limpeza profunda dos dados de texto
for col in df_filtrado.columns:
    df_filtrado[col] = df_filtrado[col].astype(str).str.replace(r'[\r\n\t]+', ' ', regex=True).str.strip()

# Trata células vazias e aplica preenchimento para células mescladas
df_filtrado = df_filtrado.replace(['nan', 'None', '<NA>', ''], None)
df_filtrado = df_filtrado.ffill()

# --- NOVO: FILTRAR E REMOVER LINHAS DE TOTALIZAÇÃO ---
# Remove linhas onde o professor seja nulo
df_filtrado = df_filtrado[df_filtrado['PROFESSOR'].notna()]

# Converte para maiúsculo temporariamente para garantir que vai remover qualquer variação de "Total"
termo_filtro = df_filtrado['PROFESSOR'].str.upper()

# Remove se o nome contiver "TOTAL" ou "SUBTOTAL"
df_filtrado = df_filtrado[~termo_filtro.str.contains('TOTAL', na=False)]

# --- RECONSTRUÇÃO DO JSON AGRUPADO ---
resultado_agrupado = []

for professor, dados_professor in df_filtrado.groupby('PROFESSOR'):
    
    lista_disciplinas = dados_professor['DISCIPLINA'].dropna().unique().tolist()
    
    colunas_historico = [c for c in dados_professor.columns if c not in ['PROFESSOR', 'DISCIPLINA']]
    historico_atividades = dados_professor[colunas_historico].to_dict(orient='records')
    
    resultado_agrupado.append({
        "PROFESSOR": professor,
        "DISCIPLINA": lista_disciplinas,
        "ATRAVESSA_POR": historico_atividades
    })

# Salvar arquivo final
with open('dados_escolas.json', 'w', encoding='utf-8') as f:
    json.dump(resultado_agrupado, f, ensure_ascii=False, indent=4)

print(f"\nConversão concluída! Linhas de 'Total Disciplina' removidas.")
print(f"Arquivo gerado com sucesso para {len(resultado_agrupado)} professores reais.")
"""

"""
CODIGO 2



import pandas as pd
import json

# 1. Carregar o arquivo Excel
nome_arquivo = 'LISTAGEM DE DISCIPLINAS POR CURSO-TURMA-PROFESSOR__.xlsx'
df = pd.read_excel(nome_arquivo)

# 2. Localizar a linha correta do cabeçalho automaticamente
linha_cabecalho = None
for i in range(min(15, len(df))):
    valores_linha = df.iloc[i].astype(str).str.upper().str.strip().tolist()
    if 'GRE' in valores_linha or 'ESCOLA' in valores_linha:
        linha_cabecalho = i
        break

if linha_cabecalho is not None:
    df = pd.read_excel(nome_arquivo, skiprows=linha_cabecalho + 1)

# 3. Padronizar e limpar os nomes das colunas
df.columns = df.columns.astype(str).str.upper().str.strip()
df.columns = df.columns.str.normalize('NFKD').str.encode('ascii', errors='ignore').str.decode('utf-8')

# Definir colunas desejadas
colunas_desejadas = [
    'GRE', 'CATEGORIA DA MODALIDADE', 'MUNICIPIO', 'ESCOLA',
    'MODALIDADE DE ENSINO', 'TURMA', 'ETAPA', 'DISCIPLINA', 'PROFESSOR'
]

colunas_existentes = [c for c in colunas_desejadas if c in df.columns]
df_filtrado = df[colunas_existentes].copy()

# --- CORREÇÃO DA QUEBRA DE TEXTO ---
# Passo A: Remove quebras de linha e tabs ocultas de todas as células individuais ANTES do ffill
for col in df_filtrado.columns:
    df_filtrado[col] = df_filtrado[col].astype(str).str.replace(r'[\r\n\t]+', ' ', regex=True).str.strip()

# Passo B: Agora sim, padroniza vazios e aplica ffill nas células mescladas legítimas
df_filtrado = df_filtrado.replace(['nan', 'None', '<NA>', ''], None)
df_filtrado = df_filtrado.ffill()

# --- REMOVER LINHAS DE TOTALIZAÇÃO ---
df_filtrado = df_filtrado[df_filtrado['PROFESSOR'].notna()]
termo_filtro = df_filtrado['PROFESSOR'].str.upper()
df_filtrado = df_filtrado[~termo_filtro.str.contains('TOTAL', na=False)]

# --- RECONSTRUÇÃO DO JSON AGRUPADO ---
resultado_agrupado = []

for professor, dados_professor in df_filtrado.groupby('PROFESSOR'):
    
    # Coleta disciplinas únicas e remove strings vazias ou nulas residuais
    lista_disciplinas = dados_professor['DISCIPLINA'].dropna().unique().tolist()
    lista_disciplinas = [d for d in lista_disciplinas if d and str(d).upper() != 'NONE']
    
    colunas_historico = [c for c in dados_professor.columns if c not in ['PROFESSOR', 'DISCIPLINA']]
    historico_atividades = dados_professor[colunas_historico].to_dict(orient='records')
    
    resultado_agrupado.append({
        "PROFESSOR": professor,
        "DISCIPLINA": lista_disciplinas,
        "ATRAVESSA_POR": historico_atividades
    })

# Salvar arquivo final
with open('dados_escolas.json', 'w', encoding='utf-8') as f:
    json.dump(resultado_agrupado, f, ensure_ascii=False, indent=4)

print("\nConversão final concluída!")
print("Textos cortados (como 'PERCURSOS DE') foram devidamente limpos e unificados.")
"""

import pandas as pd
import json

# 1. Carregar o arquivo Excel
nome_arquivo = 'LISTAGEM DE DISCIPLINAS POR CURSO-TURMA-PROFESSOR__.xlsx'
df = pd.read_excel(nome_arquivo)

# 2. Localizar a linha correta do cabeçalho automaticamente
linha_cabecalho = None
for i in range(min(15, len(df))):
    valores_linha = df.iloc[i].astype(str).str.upper().str.strip().tolist()
    if 'GRE' in valores_linha or 'ESCOLA' in valores_linha:
        linha_cabecalho = i
        break

if linha_cabecalho is not None:
    df = pd.read_excel(nome_arquivo, skiprows=linha_cabecalho + 1)

# 3. Padronizar e limpar os nomes das colunas
df.columns = df.columns.astype(str).str.upper().str.strip()
df.columns = df.columns.str.normalize('NFKD').str.encode('ascii', errors='ignore').str.decode('utf-8')

# Definir colunas desejadas
colunas_desejadas = [
    'GRE', 'CATEGORIA DA MODALIDADE', 'MUNICIPIO', 'ESCOLA',
    'MODALIDADE DE ENSINO', 'TURMA', 'ETAPA', 'DISCIPLINA', 'PROFESSOR'
]

colunas_existentes = [c for c in colunas_desejadas if c in df.columns]
df_filtrado = df[colunas_existentes].copy()

# 4. Limpeza profunda de strings e remoção de espaços extras
for col in df_filtrado.columns:
    df_filtrado[col] = df_filtrado[col].astype(str).str.replace(r'[\r\n\t]+', ' ', regex=True).str.strip()

# Trata células vazias e corrige mesclagem irregular
df_filtrado = df_filtrado.replace(['nan', 'None', '<NA>', ''], None)
df_filtrado = df_filtrado.ffill()

# --- NOVO: DICIONÁRIO DE CORREÇÃO DE DISCIPLINAS CORTADAS ---
# Caso apareça outra disciplina cortada na planilha, basta adicionar na lista abaixo
correcoes_disciplinas = {
    'PERCURSO DE': 'PERCURSOS DE APROFUNDAMENTO',
    'PERCURSOS DE': 'PERCURSOS DE APROFUNDAMENTO',
    'PERCURSO': 'PERCURSOS DE APROFUNDAMENTO'
}

# Força a coluna disciplina para maiúscula para bater com o dicionário e aplica a correção
df_filtrado['DISCIPLINA'] = df_filtrado['DISCIPLINA'].str.upper().str.strip()
df_filtrado['DISCIPLINA'] = df_filtrado['DISCIPLINA'].replace(correcoes_disciplinas)

# --- REMOVER LINHAS DE TOTALIZAÇÃO ---
df_filtrado = df_filtrado[df_filtrado['PROFESSOR'].notna()]
termo_filtro = df_filtrado['PROFESSOR'].str.upper()
df_filtrado = df_filtrado[~termo_filtro.str.contains('TOTAL', na=False)]

# --- RECONSTRUÇÃO DO JSON AGRUPADO ---
resultado_agrupado = []

for professor, dados_professor in df_filtrado.groupby('PROFESSOR'):
    
    # Garante a captação de disciplinas únicas, válidas e limpas
    lista_disciplinas = dados_professor['DISCIPLINA'].dropna().unique().tolist()
    lista_disciplinas = [d for d in lista_disciplinas if d and str(d).upper() != 'NONE']
    
    colunas_historico = [c for c in dados_professor.columns if c not in ['PROFESSOR', 'DISCIPLINA']]
    historico_atividades = dados_professor[colunas_historico].to_dict(orient='records')
    
    resultado_agrupado.append({
        "PROFESSOR": professor,
        "DISCIPLINA": lista_disciplinas,
        "ATRAVESSA_POR": historico_atividades
    })

# Salvar arquivo final em JSON
with open('dados_escolas.json', 'w', encoding='utf-8') as f:
    json.dump(resultado_agrupado, f, ensure_ascii=False, indent=4)

print("\nConversão finalizada com sucesso!")
print("A disciplina 'PERCURSO DE' foi forçada para o nome correto por extenso no JSON.")
