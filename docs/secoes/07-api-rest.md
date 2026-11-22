## 7. API REST
~200 endpoints em `django_siaa/urls.py`. Convenção: `/api/<perfil>/<recurso>` com métodos GET/POST/PUT/DELETE. Serialização manual via `JsonResponse`. Todos os endpoints de área autenticada validam sessão via cookie.

### 7.1 Principais grupos

| Prefixo | Escopo |
|---|---|
| `/api/admin/*` | Painel admin: login/auth, escolas, coordenadores, professores, alunos, turmas, e **CRUD genérico de módulos** (`/api/admin/modulos/<slug>`) |
| `/api/coordenacao/*` | Gestão escolar: professores, alunos, turmas, horários, disciplinas, notas, comunicados, advertências, calendário, avaliações, mensagens, importação de planilhas |
| `/api/teacher/*` | Professor: auth, avaliações (CRUD + PDF + correções), questões/imagens, opções, alunos por turma, notas, conteúdos, atividades, frequência, calendário, comunicados, mensagens |
| `/api/students/*` | Aluno: dashboard, conteúdos, atividades (+envios), boletim, frequência, cronograma, solicitações |
| `/api/responsavel/*` | Responsável: dados do aluno vinculado, boletim, frequência, comunicados, mensagens |
| `/api/blog/*` | Posts, comentários, curtidas, perfil |

### 7.2 Destaques de endpoints

- `GET/POST /api/teacher/avaliacoes` — listagem/criação de avaliações.
- `GET/PUT /api/teacher/avaliacoes/<id>` — detalhe com questões hierárquicas (prefetch) e atualização transacional completa.
- `POST /api/teacher/avaliacoes/<id>/pdf` — emissão de PDF da prova + gabarito.
- `GET /api/teacher/avaliacoes/<id>/correcoes` e `POST .../correcoes/salvar` — correções (foto + nota por aluno).
- `POST /api/teacher/avaliacoes/questoes/<id>/imagem` — upload de imagem de questão (com verificação de ownership).
- `/api/admin/modulos*` — CRUD genérico dirigido por registro `ADMIN_MODULES` (14 módulos).
- `/api/coordenacao/importar/<tipo>` — importação de planilhas Excel.

---
