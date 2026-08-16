# SIAA-SEDUC — Sistema Integrado de Acompanhamento Acadêmico

**Projeto FAPEPI / SEDUC-PI**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/Django%20REST%20Framework-ff1709?logo=django&logoColor=white)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

---

## 📌 Resumo do Projeto

O **SIAA-SEDUC** é uma plataforma web desenvolvida para a rede estadual de ensino do Piauí com a finalidade de integrar a gestão escolar e fortalecer o acompanhamento pedagógico entre escola, professores, alunos e famílias.

A plataforma permite que:
- **Professores** lancem notas trimestrais, controlem frequência, publiquem conteúdos de aula, atividades e comunicados.
- **Coordenação** gerencie professores, alunos e o calendário escolar unificado.
- **Alunos e Famílias** acompanhem o boletim escolar, frequência e avisos escolares.

> O desenvolvimento envolve 4 bolsistas **Seduc Tec** em um ciclo de pesquisa e desenvolvimento que fomenta a inovação e a aplicação de conhecimento técnico em um problema real da comunidade escolar.

---

## 🚀 Tecnologias

### Frontend
- **Framework:** Next.js (App Router)
- **Biblioteca:** React 19
- **Estilização:** CSS Modules & Vanilla CSS
- **Requisições:** Fetch API / Axios

### Backend
- **Framework:** Django 5.x
- **API:** Django REST Framework (DRF)
- **Autenticação & Segurança:** CORS Headers, Sessões/Tokens
- **Banco de Dados:** SQLite (Desenvolvimento) / PostgreSQL (Produção)

---

## 📂 Estrutura do Projeto

```text
siaa-seduc/
├── django_siaa/        # Backend em Django + DRF
│   ├── app/            # Modelos, views e regras de negócio
│   ├── django_siaa/    # Configurações do Django
│   └── manage.py
├── frontend/           # Frontend em Next.js
│   ├── src/app/        # Rotas da aplicação (aluno, professor, coordenacao)
│   └── package.json
├── tests/              # Testes e páginas de validação de rotas
├── DOCUMENTATION.md    # Documentação detalhada da API e arquitetura
└── README.md           # Apresentação do projeto
```

---

## 🛠️ Como Executar o Projeto

### 1. Backend (Django)

```bash
cd django_siaa

# Criar e ativar o ambiente virtual
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instalar dependências
pip install -r ../requirements.txt

# Executar migrações
python manage.py migrate

# Iniciar servidor
python manage.py runserver 0.0.0.0:8000
```

### 2. Frontend (Next.js)

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse a aplicação no navegador em [http://localhost:3000](http://localhost:3000).

---

## 📖 Documentação Completa

Para detalhes sobre modelos de dados, endpoints da API e fluxos de tela, consulte o arquivo [DOCUMENTATION.md](./DOCUMENTATION.md).

---

## 👥 Contribuidores

Agradecemos a todos os bolsistas e colaboradores envolvidos no desenvolvimento do projeto:

<a href="https://github.com/Sh4luK/siaa-seduc/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Sh4luK/siaa-seduc" alt="Contribuidores do SIAA-SEDUC" />
</a>