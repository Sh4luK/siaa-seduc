## 5. Backend — Django
### 5.1 Organização

- **`app/models.py`**: todos os models em um único arquivo (~700 linhas), agrupados por domínio.
- **`app/views.py`**: views function-based com `@csrf_exempt` e `@require_http_methods`. Serialização manual via `JsonResponse`. Funções auxiliares privadas (`_prefixo`) para auth, parsing e formatação.
- **`app/urls.py`** não existe — rotas estão em `django_siaa/urls.py` (~200 `path()`).
- **`app/views_importacao.py`**: endpoints de importação de planilhas Excel (alunos, professores, turmas, disciplinas).
- **`app/pdf.py`**: wrapper sobre `xhtml2pdf.pisa` com tratamento de erros.

### 5.2 Padrões de código observados

- Autenticação via helper `_*_logado(request)` por perfil (`_professor_atual`, `_admin_logado`, `_coordenador_atual`, etc.).
- Sessões em cookie assinada; model `Sessao` persiste sessões no banco.
- Uploads via `request.FILES` com `ImageField`/`FileField`.
- Consultas com `select_related`/`prefetch_related`/`annotate` para evitar N+1.
- Transações com `transaction.atomic()` em operações multi-tabela (ex.: edição de avaliações com questões/subquestões/alternativas).

### 5.3 Versões e migrações

- 61+ migrations em `app/migrations/`.
- Na ausência do driver psycopg no ambiente local, migrations podem ser escritas manualmente seguindo o padrão `dependencies`/`operations`.

---
