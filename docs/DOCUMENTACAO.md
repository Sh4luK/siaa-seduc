# Documentação Completa — SIAA-SEDUC

**Sistema Integrado de Acompanhamento Acadêmico — SEDUC-PI**

> Documento técnico-acadêmico do projeto. Versão 1.0 — Novembro de 2025.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Estrutura do Repositório](#4-estrutura-do-repositório)
5. [Backend — Django](#5-backend--django)
6. [Modelo de Dados](#6-modelo-de-dados)
7. [API REST](#7-api-rest)
8. [Frontend — Next.js](#8-frontend--nextjs)
9. [Módulos Funcionais](#9-módulos-funcionais)
10. [Fluxos de Trabalho](#10-fluxos-de-trabalho)
11. [Autenticação e Sessões](#11-autenticação-e-sessões)
12. [Geração de PDF](#12-geração-de-pdf)
13. [Segurança](#13-segurança)
14. [Configuração e Execução](#14-configuração-e-execução)
15. [Deploy e Infraestrutura](#15-deploy-e-infraestrutura)
16. [Limitações Conhecidas](#16-limitações-conhecidas)
17. [Glossário](#17-glossário)

---

## 1. Visão Geral

O **SIAA-SEDUC** é uma plataforma web de gestão escolar desenvolvida para a rede estadual de ensino do Piauí (SEDUC-PI), no âmbito do programa FAPEPI. O sistema integra os principais atores do ambiente escolar — **administradores, coordenadores, professores, alunos e responsáveis** — em um único ecossistema digital.

### 1.1 Objetivos

- Centralizar a gestão de dados acadêmicos (turmas, disciplinas, alunos, professores).
- Permitir o lançamento e acompanhamento de **notas por trimestre**, **frequência**, **horários** e **conteúdos programados**.
- Oferecer aos alunos e responsáveis visibilidade em tempo real sobre **boletim, frequência, atividades, avaliações e comunicados**.
- Disponibilizar ferramentas de **avaliação digital**: criação de provas com questões objetivas/subjetivas, emissão de PDF, gabarito e correção por fotografia do cartão-resposta.
- Incluir um **módulo de blog** para publicações da comunidade escolar.

### 1.2 Perfis de usuário

| Perfil | Rota base | Responsabilidades |
|---|---|---|
| Administrador | `/admin` | Gestão global: escolas, coordenadores, professores, alunos, turmas e todos os módulos de dados |
| Coordenador | `/coordenacao` | Gestão da escola: professores, alunos, turmas, horários, notas, comunicados, advertências, calendário |
| Professor | `/professor` | Conteúdos, atividades, avaliações, frequência, notas, mensagens, calendário |
| Aluno | `/aluno` | Boletim, frequência, atividades, conteúdos, cronograma, solicitações |
| Responsável | `/responsavel` | Acompanhamento do aluno vinculado: boletim, frequência, comunicados, mensagens |
| Blog | `/blog` | Publicações e comunidade |

---

## 2. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                     NAVEGADOR (Cliente)                  │
│              Next.js 16 — React 19 (App Router)          │
└──────────────────────────┬──────────────────────────────┘
                           │ fetch /backend-api/*
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Route Handlers (Proxy)              │
│        /backend-api/api/[...path] → Django REST          │
│        /backend-api/media/[...path] → arquivos           │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP (cookie de sessão)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Django 6 (Backend)                      │
│   views.py (~8.800 linhas) — views function-based        │
│   urls.py — ~200 endpoints REST                          │
│   Serialização manual via JsonResponse                   │
└──────────┬──────────────────────────────┬───────────────┘
           │ ORM                          │
           ▼                              ▼
┌─────────────────────┐        ┌──────────────────────────┐
│   PostgreSQL        │        │   Media (uploads)        │
│   (produção)        │        │   django_siaa/media/     │
│   SQLite (dev)      │        │   questões, correções,   │
└─────────────────────┘        │   conteúdos, blog        │
                               └──────────────────────────┘
```

### 2.1 Características arquiteturais

- **Monólito modular**: backend Django concentrado em `app/views.py` com views function-based (não há ViewSets DRF — serialização é manual).
- **Proxy reverso no frontend**: o Next.js expõe `/backend-api/*` que repassa ao Django, evitando problemas de CORS e centralizando a URL do backend.
- **Autenticação por cookie de sessão**: sessões Django armazenadas em banco (`Sessao` model), propagadas via cookie `credentials: "include"`.
- **Renderização híbrida**: páginas estáticas (SSG) para conteúdo público e dinâmicas (ƒ) para áreas autenticadas.

---

## 3. Stack Tecnológica

### 3.1 Backend (`django_siaa/`)

| Componente | Tecnologia |
|---|---|
| Framework | Django ≥ 6.0 |
| API | Django REST Framework (parcial — views function-based) |
| Banco de dados | PostgreSQL (produção) / SQLite (desenvolvimento local) |
| PDF | xhtml2pdf (Pisa), ReportLab, pypdf |
| Imagens | Pillow |
| Planilhas | openpyxl |
| HTTP client | requests |
| Config | python-dotenv, django-cors-headers, whitenoise |

### 3.2 Frontend (`frontend/`)

| Componente | Tecnologia |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| UI | React 19.2.4 |
| Estilo | CSS Modules (padrão do projeto) |
| Compilador | React Compiler (babel-plugin-react-compiler) |
| Markdown | react-markdown + remark-gfm (blog) |
| Deploy | Vercel |

### 3.3 Infraestrutura

- **Frontend**: Vercel (deploy automático via push).
- **Backend**: Django + PostgreSQL, servido por WSGI/ASGI.
- **DevContainer** e configurações VSCode incluídas no repositório.

---

## 4. Estrutura do Repositório

```
siaa-seduc/
├── django_siaa/                  # Backend Django
│   ├── manage.py
│   ├── requirements.txt
│   ├── db.sqlite3                # fallback dev
│   ├── media/                    # uploads (gitignored)
│   ├── *Exportados.json          # seeds de dados
│   └── django_siaa/              # projeto
│       ├── settings.py           # DEBUG→SQLite, prod→PostgreSQL
│       ├── urls.py               # ~200 rotas API
│       └── wsgi.py / asgi.py
│   └── app/                      # app principal
│       ├── models.py             # ~40 models
│       ├── views.py              # ~8.800 linhas, views function-based
│       ├── views_importacao.py   # importação de planilhas
│       ├── pdf.py                # wrapper xhtml2pdf
│       ├── migrations/           # 61+ migrations
│       ├── templates/            # templates HTML→PDF
│       │   ├── avaliacoes/pdf.html       # prova + gabarito
│       │   ├── avaliacoes/pdf_folha.html # folha de respostas
│       │   └── ...
│       └── static/               # logos e assets
│
├── frontend/                     # Next.js
│   ├── package.json
│   └── src/app/                  # 114 páginas (App Router)
│       ├── admin/                # painel administrativo
│       ├── coordenacao/          # painel do coordenador
│       ├── professor/            # painel do professor
│       ├── aluno/                # painel do aluno
│       ├── responsavel/          # painel do responsável
│       ├── blog/                 # blog público
│       ├── corrigir/             # correção (legado?)
│       ├── backend-api/          # proxy → Django
│       └── components/, utils/
│
├── docs/                         # esta documentação
├── tests/                        # testes
├── infra/                        # scripts de infra
├── funcs/                        # funções auxiliares
├── .github/                      # CI
├── .devcontainer/                # ambiente dev
└── README.md
```

---

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

## 6. Modelo de Dados

O schema é relacional e centrado na escola. Abaixo os models por domínio.

### 6.1 Pessoas e acessos

| Model | Descrição | Campos-chave |
|---|---|---|
| `Admin` | Administrador do sistema | `nome_completo`, `senha` |
| `Coordenador` | Coordenador escolar | `nome_completo`, `senha`, `escola`, `ip` |
| `Professor` | Docente | `nome_completo`, `senha`, `ip` |
| `Estudante` | Aluno | `posicao_ordem`, `nome_completo`, `escola`, `serie`, `periodo`, `curso`, `turma`, `modo_de_ensino`, `senha`, `ip` |
| `Responsavel` | Responsável legal | `nome_completo`, `senha`, `ip` |
| `Blogger` | Autor do blog | perfil público |
| `Sessao` | Sessão de login | user_type, user_id, token, expiração |

### 6.2 Estrutura acadêmica

| Model | Descrição |
|---|---|
| `Escola` | Escola (INEP, endereço, contato) |
| `AtravessaPor` | Vínculo professor↔turma (`professor`, `escola`, `turma`, `etapa`, `disciplina_lecionada`) |
| `Disciplina` | Disciplina com M2M `professores` |
| `HorarioAula` | Grade semanal (`turma`, `dia_semana` SEG–SEX, `hora_inicio`, `hora_fim`) |

### 6.3 Avaliação do aluno

| Model | Descrição |
|---|---|
| `Nota` | Boletim por trimestre: NM1–3, RPT, MT, MTF por T1/T2/T3 + MA, PF, MAF, RCF, TGF, RF (status: CUR/AP/RE/DE/FA/AB/TR/CA/TT/TO). Unique por (aluno, disciplina, turma, professor, ano_letivo) |
| `Frequencia` | Presença/falta por aula (unique por aluno+disciplina+turma+professor+data) |
| `Aula` | Registro de aula (disciplina, professor, turma, data, assunto, estratégia) |
| `EstudoProgramado` | Lista de estudos do aluno |

### 6.4 Conteúdo pedagógico

| Model | Descrição |
|---|---|
| `Conteudo` | Material publicado (arquivo, título, descrição, data) |
| `Atividade` | Atividade com prazo e arquivo |
| `AtividadeQuestao` / `AtividadeAlternativa` | Questões e alternativas de atividade |
| `AtividadeEnvio` | Envio do aluno (arquivo, status, alteração solicitada) |
| `AtividadeResposta` | Respostas texto do aluno |
| `Avaliacao` | Prova: título, descrição, texto introdutório, data, turma (string), disciplina, ano_letivo |
| `Questao` | Questão hierárquica (`questao_pai`, `letra_subquestao`, `ordem`, `enunciado`, `tipo` OBJETIVA/SUBJETIVA, `imagem`, `linhas_resposta`) |
| `Alternativa` | Alternativa com flag `correta` (gabarito) |
| `AvaliacaoCorrecao` | Correção por aluno: foto do gabarito (`imagem`) + `nota` (unique por avaliação+aluno) |

### 6.5 Comunicação

| Model | Descrição |
|---|---|
| `Comunicado` | Aviso (autor: professor ou coordenador, turma opcional) |
| `Evento` | Evento do calendário (autor opcional, turma opcional) |
| `Advertencia` | Advertência/penalidade/suspensão com datas |
| `Conversa` / `MensagemChat` | Chat professor↔coordenação |
| `ConversaResponsavelProfessor`, `ConversaResponsavelCoordenador` + `MensagemChat*` | Chats do responsável |
| `VinculoResponsavel` | Vínculo responsável↔aluno |

### 6.6 Blog

`Post`, `Comentario`, `Curtida`, `PerfilBlog` — publicações com markdown, comentários e curtidas.

---

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

## 8. Frontend — Next.js

### 8.1 Rotas (App Router)

```
/                          landing pública
/admin                     painel administrativo (sidebar)
/admin/{escolas,coordenadores,professores,alunos,turmas}
/admin/modulos/[modulo]    CRUD genérico de dados
/admin/login
/coordenacao/*             visão geral, alunos, professores, turmas,
                           horarios, disciplinas, notas, comunicados,
                           advertencias, calendario, avaliacoes,
                           mensagens, solicitacoes, importação
/professor/*               dashboard, turmas, alunos, notas,
                           frequencia, conteudos, atividades(+correção),
                           avaliacoes (lista/novo/[id]/editar/corrigir),
                           calendario, comunicados, mensagem, horarios
/aluno/*                   dashboard, boletim, frequencia, conteudos,
                           atividades(+envios), cronograma, horarios,
                           solicitacoes
/responsavel/[alunoId]/*   visão do aluno, boletim, frequencia,
                           avaliacoes, calendario, comunicados,
                           advertencias, horario, mensagens
/blog                      posts, post/[id], perfil [user], novo, editar
/corrigir/*                módulo de correção (legado/alternativo)
/backend-api/*             proxy para o Django (api + media)
```

### 8.2 Padrões frontend

- **CSS Modules** por página (`page.module.css`) — sem framework de UI.
- Autenticação verificada no cliente via `GET /api/*/auth` com `credentials: "include"`; redirect para login em 401.
- Fetches paralelos com `Promise.all` para reduzir tempo de carregamento.
- Proxy `/backend-api` encapsula a URL do backend (`src/app/backend-api/`).
- React Compiler habilitado; imagens via `next/image` (com exceções pontuais `<img>` para blobs de preview).

---

## 9. Módulos Funcionais

### 9.1 Avaliações (destaque)

Ciclo completo implementado:

1. **Criação/Edição** (`/professor/avaliacoes/novo`, `/editar`): título, data, turma, disciplina, texto introdutório, questões manuais ou extraídas de PDF, questões objetivas (alternativas A–E com flag `correta`) e subjetivas (linhas de resposta), subquestões aninhadas (a, b, c...) e upload de imagens por questão.
2. **Emissão de PDF**: prova formatada com cabeçalho, questões hierárquicas e **tabela de gabarito** (círculos para preencher) — gerada apenas quando 100% das questões são objetivas.
3. **Visualização** (`/[avaliacaoId]`): detalhe hierárquico, gabarito em tabela (letra correta por questão/subquestão), ações de editar/excluir/corrigir.
4. **Correção** (`/[avaliacaoId]/corrigir`): lista todos os alunos da turma da avaliação; para avaliações 100% objetivas, upload de foto do gabarito preenchido + nota; para avaliações com subjetivas, correção manual da nota. Dados persistidos em `AvaliacaoCorrecao`.

### 9.2 Notas

Lançamento por trimestre (NM1–3, RPT, MT, MTF) com médias (MA, PF, MAF, RCF), carga horária (TGF) e situação final (RF). Acesso via `/professor/notas/[turmaId]` e `/coordenacao/notas/[turmaId]`.

### 9.3 Frequência e aulas

Registro de presença por aula; aulas com assunto e estratégia; visão por turma e por aluno.

### 9.4 Atividades

Criação com arquivo e questões; alunos enviam arquivo/texto; professor corrige envios (`/professor/atividades/[id]/corrigir/[envioId]`); alunos podem solicitar novo envio.

### 9.5 Comunicação

Comunicados (turma ou geral), calendário de eventos, advertências/penalidades/suspensões, chat professor↔coordenação e responsável↔professor/coordenação.

### 9.6 Administração

Painel `/admin` com gestão cadastral (escolas, coordenadores, professores, alunos, turmas — incluindo renomear turma) e **CRUD genérico de 14 módulos de dados** via `/admin/modulos/[modulo]` (tabela + busca + modal de criação/edição + exclusão), além de importação de planilhas na coordenação.

### 9.7 Blog

Publicações em markdown com comentários, curtidas e perfis de autores.

---

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

## 11. Autenticação e Sessões

- Login por perfil: `POST /api/<perfil>/login` com `nome_completo`/`senha` (ou CPF/email conforme perfil).
- Senhas armazenadas em texto plano nos models (`senha = CharField`) — **ver Limitações**.
- Sessão Django persistida no model `Sessao` e entregue via cookie HttpOnly.
- `credentials: "include"` em todos os fetches do frontend.
- Endpoints validam ownership (ex.: professor só acessa avaliações próprias; coordenador só sua escola).

---

## 12. Geração de PDF

- Engine: **xhtml2pdf (Pisa)** — HTML+CSS → PDF.
- Templates Django em `app/templates/avaliacoes/`:
  - `pdf.html` — prova completa: cabeçalho, dados da avaliação, questões hierárquicas, linhas de resposta, imagens e **gabarito tabular com círculos CSS** (`border`+`border-radius`, pois a Helvetica não tem glifo de círculo).
  - `pdf_folha.html` — folha de respostas alternativa.
- Restrições do Pisa contornadas: sem `linear-gradient`, sem `@page :first`, pseudo-elementos decorativos removidos, margens 0.5cm.
- Logos SIAA/SEDUC embutidos via `file://` a partir de `BASE_DIR/app/static/`.

---

## 13. Segurança

**Implementado:**
- Verificação de autenticação e ownership nos endpoints sensíveis.
- Sessões por cookie (não JWT em localStorage).
- `unique_together`/constraints no banco para integridade.
- Validação de entrada básica (tipos, obrigatórios) nos novos endpoints genéricos.

**Débitos técnicos (ver seção 16):**
- Senhas em texto plano.
- CSRF desabilitado globalmente (`@csrf_exempt`) — aceitável para API por cookie somente se houver proteção equivalente; recomendo revisar.
- Uploads sem validação rigorosa de tipo/tamanho em todos os endpoints.

---

## 14. Configuração e Execução

### 14.1 Backend

```bash
cd django_siaa
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # configurar DATABASE_URL/SECRET_KEY
python manage.py migrate
python manage.py runserver
```

- `settings.py`: `DEBUG=True` → SQLite local; produção → PostgreSQL via env.
- Criação de admin: `python manage.py shell` → `Admin.objects.create(nome_completo="...", senha="...")`.

### 14.2 Frontend

```bash
cd frontend
npm install
npm run dev      # desenvolvimento
npm run build    # produção
npm run lint     # eslint
```

- Proxy `/backend-api` configurado para o Django (ver `src/app/backend-api/`).
- Deploy: Vercel (build `next build`).

---

## 15. Deploy e Infraestrutura

- **Frontend**: Vercel — deploy automático por push na branch principal.
- **Backend**: Django + PostgreSQL; variáveis de ambiente via `.env`/`python-dotenv`.
- **Mídia**: `django_siaa/media/` servida via rota `/backend-api/media/` no proxy.
- **CI**: `.github/` presente; scripts em `infra/` e `commit.sh`.

---

## 16. Limitações Conhecidas

1. **Senhas em texto plano** em todos os models de usuário — recomenda-se migrar para hash (`make_password`/`check_password`).
2. **`@csrf_exempt` generalizado** — a API depende apenas de cookie de sessão; avaliar CSRF token ou SameSite.
3. **Validação de uploads** inconsistente — nem todos os endpoints verificam MIME/tamanho.
4. **Serialização manual** em `views.py` — ~8.800 linhas; candidato a DRF serializers ou refatoração por domínio.
5. **Sem testes automatizados** significativos — `tests/` existe mas cobertura é limitada.
6. **Correção de avaliações** armazena foto + nota, mas **não há correção automática** (OMR/OCR) — a nota é informada manualmente pelo professor.
7. **`next build`** já foi bloqueado por erros de sintaxe em páginas de aluno — manter lint/build verde.
8. **Campos `FileField`** (atividades/conteúdos) não são editáveis via CRUD genérico do admin.
9. **Mensagens de chat** não são gerenciáveis individualmente (apenas a conversa).
10. **xhtml2pdf** impõe restrições de CSS (sem gradientes, `:first`, pseudo-elementos complexos).

---

## 17. Glossário

| Termo | Significado |
|---|---|
| **AtravessaPor** | Modelo de vínculo professor↔turma ("atravessa" a turma) |
| **Gabarito** | Cartão-resposta / chave de correção das avaliações objetivas |
| **NM / RPT / MT / MTF** | Nota do bimestre / Recuperação / Média do Trimestre / Média Final Trimestre |
| **MA / PF / MAF / RCF** | Média Anual / Prova Final / Média Anual Final / Recuperação Final |
| **RF** | Resultado Final (CUR, AP, RE, DE, FA, AB, TR, CA, TT, TO) |
| **TGF** | Total de Frequência Global |
| **Seduc Tec** | Programa FAPEPI de bolsistas para desenvolvimento |
| **FAPEPI** | Fundação de Amparo à Pesquisa do Piauí |
| **Pisa** | Engine de conversão HTML→PDF usada pelo xhtml2pdf |
| **OMR/OCR** | Reconhecimento de marcas/dígitos (não implementado) |

---

*Fim da documentação. Para dúvidas ou contribuições, consultar o repositório e os padrões descritos na seção 5.2.*
