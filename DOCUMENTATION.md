# Documentação do Projeto — SIAA-SEDUC

**Sistema Integrado de Acompanhamento Acadêmico**  
Projeto de Pesquisa e Desenvolvimento em parceria **FAPEPI / SEDUC-PI**.

---

## 1. Visão Geral

O **SIAA-SEDUC** é uma plataforma web desenvolvida para a rede estadual de ensino do Piauí com o objetivo de centralizar e modernizar a gestão escolar e fortalecer o acompanhamento pedagógico entre escola, professores, alunos e famílias.

### Principais Objetivos:
- **Gestão Pedagógica:** Controle de turmas, disciplinas, notas trimestrais, frequência e conteúdos lecionados.
- **Gestão de Coordenação:** Cadastro, edição e acompanhamento de professores, estudantes e eventos do calendário escolar.
- **Portal do Aluno / Família:** Acesso ao boletim digital, notas, faltas e comunicados.
- **Comunicação Ativa:** Divulgação de comunicados e eventos escolares.

---

## 2. Tecnologias Utilizadas

### Backend
- **Linguagem:** Python 3.10+
- **Framework:** Django + Django REST Framework (DRF)
- **CORS & Utilitários:** `django-cors-headers`, `python-dotenv`, `pandas`, `openpyxl`
- **Banco de Dados:** SQLite (desenvolvimento) / PostgreSQL (produção)

### Frontend
- **Framework:** Next.js (App Router) + React 19
- **Estilização:** CSS Modules & Vanilla CSS
- **Comunicação HTTP:** Fetch API / Axios

---

## 3. Estrutura do Repositório

```text
siaa-seduc/
├── django_siaa/                # Aplicação Backend (Django)
│   ├── app/                    # App principal (models, views, migrations)
│   │   ├── models.py           # Modelos de dados (Aluno, Professor, Turma, etc.)
│   │   ├── views.py            # Endpoints da API REST
│   │   └── funcs/              # Utilitários e regras de negócio
│   ├── django_siaa/            # Configurações do projeto Django (settings, urls)
│   ├── manage.py
│   └── requirements.txt        # Dependências Python
├── frontend/                   # Aplicação Frontend (Next.js)
│   ├── src/
│   │   └── app/
│   │       ├── aluno/          # Módulo do Aluno (login, boletim, dashboard)
│   │       ├── coordenacao/    # Módulo da Coordenação (gestão de alunos/professores/calendário)
│   │       ├── professor/      # Módulo do Professor (turmas, notas, frequência, aulas)
│   │       └── layout.js / page.js
│   ├── package.json
│   └── next.config.mjs
├── tests/                      # Scripts de teste e páginas HTML de validação de rotas
├── DOCUMENTATION.md            # Documentação técnica do projeto
└── README.md                   # Apresentação do projeto
```

---

## 4. Módulos da Aplicação

### 🎓 Módulo Aluno (`/aluno`)
- **Login:** Autenticação por matrícula/credenciais.
- **Dashboard:** Visão geral do estudante.
- **Boletim (`/aluno/boletim`):** Consulta detalhada de notas por trimestre (NM1, NM2, NM3, RPT, Média Final, RF).

### 👨‍🏫 Módulo Professor (`/professor`)
- **Login e Autenticação:** Acesso seguro do corpo docente.
- **Turmas (`/professor/turmas`):** Listagem e detalhes das turmas vinculadas ao docente.
- **Lançamento de Notas (`/professor/notas`):** Inserção e edição de notas individuais e em lote por turma.
- **Frequência (`/professor/frequencia`):** Registro de presença/faltas e consulta de histórico.
- **Conteúdos e Atividades:** Registro de aulas ministradas e atividades agendadas.
- **Comunicados e Calendário:** Envio de informes e marcação de compromissos.

### 🏛️ Módulo Coordenação (`/coordenacao`)
- **Gestão de Professores:** Cadastro, edição, visualização e desativação.
- **Gestão de Alunos:** Cadastro, edição, visão geral do aluno e histórico de advertências.
- **Calendário Escolar:** Criação, edição e exclusão de eventos escolares.

---

## 5. Como Executar Localmente

### Pré-requisitos
- Python 3.10 ou superior
- Node.js 18 ou superior
- Git

### Passo 1: Configurar e Rodar o Backend

```bash
# Navegar até o diretório do backend
cd django_siaa

# Criar e ativar o ambiente virtual
python -m venv venv
source venv/bin/activate   # Linux/macOS
# ou venv\Scripts\activate # Windows

# Instalar as dependências
pip install -r ../requirements.txt

# Executar as migrações do banco de dados
python manage.py migrate

# Iniciar o servidor de desenvolvimento Django
python manage.py runserver 0.0.0.0:8000
```

O servidor da API estará rodando em: `http://localhost:8000/api/`

---

### Passo 2: Configurar e Rodar o Frontend

```bash
# Navegar até a pasta do frontend (em outro terminal)
cd frontend

# Instalar as dependências
npm install

# Iniciar o servidor de desenvolvimento Next.js
npm run dev
```

A aplicação estará acessível em: `http://localhost:3000`

---

## 6. Principais Endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/students/login` | Autenticação de alunos |
| `GET` | `/api/students/notas` | Consulta de boletim do aluno |
| `POST` | `/api/teacher/login` | Autenticação de professores |
| `GET` | `/api/teacher/search/turmas` | Listagem de turmas do professor |
| `GET` / `POST` | `/api/teacher/notas/turma/get` / `salvar` | Consulta e lançamento de notas por turma |
| `GET` / `POST` | `/api/teacher/frequencia/turma/get` / `salvar` | Gestão de frequência escolar |
| `POST` | `/api/coordenacao/login` | Autenticação da coordenação |
| `GET` / `POST` | `/api/coordenacao/professores` | Listagem e criação de professores |
| `GET` / `POST` | `/api/coordenacao/alunos` | Listagem e criação de alunos |
| `GET` / `POST` | `/api/coordenacao/calendario/eventos` | Listagem e criação de eventos escolares |

---

## 7. Contribuição e Licença

Este projeto é desenvolvido com apoio e fomento da **FAPEPI** e **SEDUC-PI**.
Para propor melhorias ou relatar problemas, utilize o fluxo de *Pull Requests* e *Issues* no repositório.
