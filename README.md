<!-- # siaa-seduc
Sistema Integrado de Acompanhamento Acadêmico (React + Django) - Projeto FAPEPI/SEDUC -->

# SIAA-SEDUC — Sistema Integrado de Acompanhamento Acadêmico

**Projeto FAPEPI / SEDUC-PI**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/Django%20REST%20Framework-ff1709?logo=django&logoColor=white)
![License](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

> Repositório original: [github.com/Sh4luK/siaa-seduc](https://github.com/Sh4luK/siaa-seduc)

## 📖 Sobre o projeto

O **SIAA (Sistema Integrado de Acompanhamento Acadêmico)** é uma aplicação web desenvolvida no contexto do projeto **FAPEPI/SEDUC** (Fundação de Amparo à Pesquisa do Estado do Piauí / Secretaria de Estado da Educação do Piauí), com o objetivo de centralizar e facilitar o acompanhamento acadêmico de estudantes, oferecendo uma interface moderna (React) conectada a uma API robusta (Django REST Framework).

A proposta do sistema é servir como camada de integração entre dados acadêmicos (ex.: planilhas, relatórios, indicadores escolares) e usuários finais (gestores, professores, coordenadores), permitindo consulta, análise e acompanhamento de forma centralizada, substituindo processos manuais e dispersos em arquivos avulsos.

## ✨ Funcionalidades

Com base na stack tecnológica e na estrutura do repositório, o sistema contempla (ou tem como objetivo contemplar) as seguintes funcionalidades:

- **API REST para dados acadêmicos**, construída com Django REST Framework, expondo endpoints consumidos pelo front-end.
- **Interface web em React** para visualização e interação com os dados de acompanhamento acadêmico.
- **Importação/exportação e processamento de planilhas**, viabilizado pelas bibliotecas `pandas` e `openpyxl`, permitindo ler, tratar e gerar arquivos Excel (`.xlsx`) com dados escolares (ex.: notas, frequência, indicadores).
- **Comunicação Front-end ↔ Back-end via HTTP**, usando `axios` no front e `django-cors-headers` no back para liberar requisições cross-origin entre o React (porta do dev server) e a API Django.
- **Configuração baseada em variáveis de ambiente**, com `python-dotenv`, mantendo segredos e parâmetros de ambiente fora do código-fonte (arquivo `.env`).
- **Navegação client-side** com `react-router` / `react-router-dom` (v7), permitindo múltiplas telas/rotas na SPA sem recarregar a página.
- **Interface estilizada** com `Bootstrap 5` e `TailwindCSS` (via `@tailwindcss/postcss`), combinando componentes prontos com utilitários de estilização.
- **Scripts de infraestrutura e automação**, presentes nas pastas `infra` e `funcs`, usados provavelmente para setup de ambiente, deploy ou rotinas auxiliares (parte em PowerShell/Shell, conforme composição de linguagens do repositório).
- **Testes automatizados**, organizados na pasta `tests`.

> ⚠️ **Nota de transparência:** o GitHub bloqueia a navegação automatizada pelas páginas de diretório (`/tree/...`) deste repositório para acessos automatizados, e o repositório não expõe uma API pública de conteúdo acessível sem autenticação a partir daqui. Por isso, esta documentação foi construída a partir dos arquivos raiz acessíveis (`README.md`, `requirements.txt`, `package.json`), da descrição oficial do projeto e da composição de linguagens exibida pelo GitHub — **não foi possível inspecionar o conteúdo interno de `django_siaa/`, `frontend/`, `funcs/`, `infra/` e `tests/`**. As funcionalidades acima refletem o que a stack e a estrutura de pastas *sugerem*; para uma descrição 100% precisa, recomenda-se clonar o repositório localmente e revisar o código-fonte de cada módulo.

## 🏗️ Estrutura do código

Estrutura de diretórios e arquivos identificada na raiz do repositório:

```
siaa-seduc/
├── .env                  # Variáveis de ambiente (não versionar segredos reais)
├── .vscode/              # Configurações do editor (VS Code) para o projeto
├── .gitignore            # Arquivos/pastas ignorados pelo Git
├── django_siaa/          # Back-end: projeto/apps Django + API (Django REST Framework)
├── frontend/             # Front-end: aplicação React (SPA)
├── funcs/                # Funções auxiliares/scripts (utilitários, automações, possíveis serverless functions)
├── infra/                # Recursos de infraestrutura (deploy, ambiente, configuração de servidores)
├── tests/                # Testes automatizados do projeto
├── node_modules/         # Dependências JS instaladas (gerado por `npm install`)
├── package.json          # Dependências e scripts do front-end (Node/React)
├── package-lock.json     # Lockfile das dependências JS
├── requirements.txt      # Dependências Python do back-end (Django)
└── README.md             # Documentação do projeto
```

### Composição de linguagens do repositório

| Linguagem  | Participação aproximada |
|------------|--------------------------|
| JavaScript | 39,4% |
| Python     | 35,8% |
| CSS        | 16,1% |
| PowerShell | 5,6% |
| Shell      | 1,9% |
| HTML       | 1,2% |

Essa distribuição confirma a natureza **full-stack** do projeto: front-end em JavaScript/CSS (React), back-end em Python (Django), e uma camada de automação/infraestrutura em PowerShell e Shell script (provavelmente ligada às pastas `infra/` e `funcs/`).

## 🛠️ Stack tecnológica

### Back-end (`django_siaa/`, `requirements.txt`)
| Pacote | Função |
|---|---|
| `django` | Framework web principal do back-end |
| `djangorestframework` | Construção da API REST consumida pelo front-end |
| `django-cors-headers` | Habilita CORS para comunicação com o front-end React |
| `requests` | Requisições HTTP a serviços externos |
| `python-dotenv` | Carregamento de variáveis de ambiente a partir de arquivo `.env` |
| `pathlib` | Manipulação de caminhos de arquivos |
| `pandas` | Processamento e análise de dados tabulares (planilhas, relatórios) |
| `openpyxl` | Leitura/escrita de arquivos Excel (`.xlsx`) |

### Front-end (`frontend/`, `package.json`)
| Pacote | Função |
|---|---|
| `react` (^19) | Biblioteca principal da interface |
| `react-router` / `react-router-dom` (^7) | Roteamento client-side da SPA |
| `axios` | Cliente HTTP para consumir a API Django |
| `bootstrap` (^5) | Componentes e grid de UI |
| `@tailwindcss/postcss` | Utilitários de estilização via Tailwind CSS |
| `cors` / `next-cors` | Suporte a CORS no lado do front-end/build |
| `babel-plugin-react-compiler` (dev) | Otimização de compilação do React |

## 🚀 Como executar o projeto

> As instruções abaixo seguem o padrão convencional para projetos **Django + React** e devem ser conferidas/ajustadas conforme os arquivos internos de `django_siaa/` e `frontend/` (ex.: nome real do módulo de settings, scripts do `package.json`).

### Pré-requisitos
- Python 3.10+ e `pip`
- Node.js 18+ e `npm`
- Git

### 1. Clonar o repositório
```bash
git clone https://github.com/Sh4luK/siaa-seduc.git
cd siaa-seduc
```

### 2. Configurar o back-end (Django)
```bash
python -m venv venv
source venv/bin/activate      # Linux/Mac
venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

Crie/edite o arquivo `.env` na raiz com as variáveis necessárias (ex.: `SECRET_KEY`, `DEBUG`, credenciais de banco de dados, etc.), conforme utilizado pelo `python-dotenv` dentro de `django_siaa/`.

```bash
cd django_siaa
python manage.py migrate
python manage.py runserver
```

### 3. Configurar o front-end (React)
```bash
cd frontend
npm install
npm start
```

Por padrão, o back-end Django deve rodar em `http://localhost:8000` e o front-end React em `http://localhost:3000` (ajustar conforme configuração real do projeto e do `django-cors-headers`).

## 🧪 Testes

Os testes automatizados do projeto estão organizados na pasta `tests/`. Para executá-los (ajustar comando conforme o framework de testes efetivamente utilizado):

```bash
# Back-end
python manage.py test

# Front-end
npm test
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas alterações (`git commit -m 'Adiciona minha feature'`)
4. Faça push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

## 📄 Licença

Não foi identificado um arquivo de licença (`LICENSE`) no repositório no momento da escrita desta documentação. Verifique diretamente no GitHub antes de reutilizar o código.

## 👤 Autor / Mantenedor

- [Sh4luK](https://github.com/Sh4luK) — repositório do projeto SIAA-SEDUC

---

*Documentação gerada com base nas informações públicas disponíveis no repositório em julho de 2026. Para detalhes de implementação, consulte diretamente o código-fonte em cada diretório do projeto.*