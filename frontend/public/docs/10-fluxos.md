## 10. Fluxos de Trabalho
### 10.1 Avaliação — ponta a ponta

```
Professor cria avaliação (questões+alternativas)
        │
        ├─► Emite PDF (prova + gabarito se 100% objetiva)
        │
        ├─► Imprime, aplica em sala
        │
        ▼
Aluno responde → fotografa gabarito
        │
        ▼
Professor /corrigir → upload foto + nota → "Enviar nota"
        │
        ▼
AvaliacaoCorrecao persistida (imagem + nota por aluno)
```

### 10.2 Lançamento de notas

Professor/coordenação acessa `/notas/[turmaId]` → edita campos por bimestre → salva → `Nota` atualizada (unique por aluno+disciplina+turma+professor+ano).

### 10.3 Importação de dados

Coordenação envia planilha → `/api/coordenacao/importar/<tipo>` → `views_importacao.py` parseia via openpyxl → cria/atualiza registros em lote.

---
