# Documentação Técnica — SIAA-SEDUC

## 1. Visão geral

**SIAA** — Sistema Integrado de Acompanhamento Acadêmico — é um sistema web desenvolvido no âmbito do **projeto FAPEPI/SEDUC**, unindo:

- **Front-end**: SPA (Single Page Application) em **React 19**;
- **Back-end**: API REST em **Django + Django REST Framework**;
- **Camada de dados/relatórios**: processamento de planilhas com **pandas** e **openpyxl**.

Repositório: `Sh4luK/siaa-seduc` (branch principal: `main`, 196 commits até o momento da análise).

## 2. Escopo e limitações desta documentação

Esta documentação foi elaborada **a partir de fontes públicas acessíveis do repositório**:

- Descrição oficial do projeto no GitHub;
- Conteúdo do `README.md` original (arquivo mínimo, apenas com o título e descrição do projeto);
- Conteúdo integral de `requirements.txt` e `package.json` (arquivos raiz, lidos diretamente);
- Listagem dos diretórios/arquivos de nível raiz exibida na página principal do repositório;
- Estatística de composição de linguagens fornecida pelo GitHub (gráfico de linguagens).

**Não foi possível**, a partir do ambiente usado para gerar este documento, abrir as páginas internas de diretório (`/tree/main/<pasta>`) do repositório nem consultar a API de conteúdo do GitHub, pois esse tipo de navegação está bloqueado para acesso automatizado nesta sessão. Consequentemente, os itens abaixo são **inferências plausíveis**, não confirmações de código-fonte:

- Conteúdo interno de `django_siaa/` (apps Django, models, views, serializers, urls);
- Conteúdo interno de `frontend/` (componentes React, páginas, serviços de API);
- Conteúdo interno de `funcs/` e `infra/`;
- Conteúdo interno de `tests/`.

Recomenda-se **clonar o repositório localmente** (`git clone https://github.com/Sh4luK/siaa-seduc.git`) para validar e detalhar essas seções com precisão total.

## 3. Arquitetura (visão inferida)

```
┌────────────────────┐        HTTP/JSON (axios)        ┌──────────────────────────┐
│   Frontend (React)  │  ───────────────────────────▶  │  Backend (Django + DRF)  │
│  - React Router 7   │  ◀───────────────────────────  │  - django-cors-headers   │
│  - Bootstrap 5      │                                  │  - API REST              │
│  - Tailwind (CSS)   │                                  │  - Autenticação/Views    │
└────────────────────┘                                  └────────────┬─────────────┘
                                                                       │
                                                                       ▼
                                                        ┌───────────────────────────┐
                                                        │ Processamento de dados     │
                                                        │ - pandas / openpyxl        │
                                                        │ - Planilhas / relatórios   │
                                                        └───────────────────────────┘
```

O front-end React consome uma API REST fornecida pelo Django/DRF. O `django-cors-headers` sugere que front e back rodam em origens/portas diferentes durante o desenvolvimento (ex.: `localhost:3000` e `localhost:8000`). A presença de `pandas` e `openpyxl` no back-end indica rotinas de **importação/exportação/análise de planilhas acadêmicas** (notas, frequência, indicadores escolares), coerente com o propósito de "acompanhamento acadêmico".

## 4. Estrutura de diretórios (raiz)

| Caminho | Tipo | Descrição (confirmada/inferida) |
|---|---|---|
| `.env` | arquivo | Variáveis de ambiente do projeto (confirmado que existe; conteúdo não acessível/não deve ser versionado com segredos reais) |
| `.vscode/` | pasta | Configurações do VS Code para o projeto (confirmado existir) |
| `django_siaa/` | pasta | Projeto/back-end Django (nome confirmado; conteúdo inferido) |
| `frontend/` | pasta | Aplicação React (nome confirmado; conteúdo inferido) |
| `funcs/` | pasta | Funções/scripts utilitários (nome confirmado; propósito inferido) |
| `infra/` | pasta | Infraestrutura/deploy/automação (nome confirmado; propósito inferido, provavelmente ligado aos scripts PowerShell/Shell do projeto) |
| `node_modules/` | pasta | Dependências Node instaladas (gerada automaticamente por `npm install`) |
| `tests/` | pasta | Testes automatizados (nome confirmado; framework não identificado) |
| `.gitignore` | arquivo | Regras de exclusão do Git (confirmado existir) |
| `README.md` | arquivo | Documentação (conteúdo original mínimo, lido integralmente) |
| `package.json` | arquivo | Dependências/scripts do front-end (lido integralmente) |
| `package-lock.json` | arquivo | Lockfile de dependências JS (confirmado existir) |
| `requirements.txt` | arquivo | Dependências Python do back-end (lido integralmente) |

## 5. Dependências — detalhamento

### 5.1 `requirements.txt` (Python / back-end)

```
django
requests
djangorestframework
django-cors-headers
python-dotenv
pathlib
json
pandas
openpyxl
```

| Pacote | Papel no sistema |
|---|---|
| **django** | Framework principal: ORM, roteamento, admin, models |
| **djangorestframework** | Criação de endpoints REST, serializers, viewsets |
| **django-cors-headers** | Middleware que permite chamadas cross-origin do front-end React |
| **requests** | Chamadas HTTP a serviços/APIs externas (ex.: integrações com sistemas da SEDUC) |
| **python-dotenv** | Leitura de variáveis de ambiente do `.env` (chaves, DEBUG, URLs de banco etc.) |
| **pathlib** | Manipulação de caminhos de arquivos de forma orientada a objetos |
| **json** | Serialização/deserialização de dados (nota: `json` é módulo padrão do Python; sua presença explícita no requirements pode ser redundante ou herdada de outro ambiente) |
| **pandas** | Leitura, tratamento e análise de dados tabulares (planilhas de notas/frequência) |
| **openpyxl** | Leitura e escrita de arquivos `.xlsx` (relatórios em Excel) |

### 5.2 `package.json` (JavaScript / front-end)

```json
{
  "dependencies": {
    "@tailwindcss/postcss": "^4.3.1",
    "axios": "^1.16.1",
    "bootstrap": "^5.3.8",
    "cors": "^2.8.6",
    "next-cors": "^1.0.0",
    "react": "^19.2.6",
    "react-router": "^7.15.1",
    "react-router-dom": "^7.15.1"
  },
  "devDependencies": {
    "babel-plugin-react-compiler": "^1.0.0"
  }
}
```

| Pacote | Papel no sistema |
|---|---|
| **react** | Biblioteca base da SPA |
| **react-router / react-router-dom** | Roteamento entre telas (ex.: dashboard, relatórios, login) |
| **axios** | Cliente HTTP para consumo da API Django |
| **bootstrap** | Sistema de grid e componentes prontos de UI |
| **@tailwindcss/postcss** | Pipeline do Tailwind CSS via PostCSS, para utilitários de estilo |
| **cors / next-cors** | Suporte a CORS no lado do front-end/build (chama atenção a presença de `next-cors`, o que pode indicar uso pontual de padrões Next.js ou herança de outro boilerplate, mesmo o projeto não sendo necessariamente Next.js) |
| **babel-plugin-react-compiler** (dev) | Plugin do compilador do React para otimizações em tempo de build |

> **Observação técnica:** o `package.json` não define uma seção `"scripts"` visível (ex.: `start`, `build`, `test`), o que é incomum para um projeto React padrão (geralmente criado via Create React App ou Vite, que já vêm com esses scripts). Isso sugere que os scripts de execução podem estar definidos em outro `package.json` dentro da pasta `frontend/`, ou que o projeto ainda está em estágio inicial de configuração.

## 6. Fluxo de dados (inferido)

1. O usuário acessa a aplicação React (`frontend/`).
2. O React faz requisições via `axios` para a API Django (`django_siaa/`).
3. O Django processa a requisição, podendo consultar banco de dados e/ou disparar rotinas com `pandas`/`openpyxl` para gerar ou ler relatórios/planilhas acadêmicas.
4. A resposta (JSON) retorna ao front-end, que renderiza os dados de acompanhamento acadêmico usando componentes estilizados com Bootstrap/Tailwind.
5. Navegação entre páginas (dashboard, listagens, relatórios) é controlada pelo `react-router`.

## 7. Ambiente e configuração

- **Variáveis de ambiente**: geridas via `.env` + `python-dotenv` no back-end.
- **CORS**: liberado via `django-cors-headers` (back-end) e pacotes `cors`/`next-cors` (front-end/build), permitindo que o front (porta própria, ex. 3000) converse com o back (porta própria, ex. 8000).
- **Editor**: o repositório inclui uma pasta `.vscode/`, sugerindo configurações padronizadas de desenvolvimento (ex. extensões recomendadas, configurações de linting/debug) para times usando VS Code.

## 8. Infraestrutura e automação (`infra/`, `funcs/`)

A composição de linguagens do repositório mostra presença de **PowerShell (5,6%)** e **Shell script (1,9%)**, o que é consistente com scripts localizados nas pastas `infra/` e/ou `funcs/`, prováveis responsáveis por:

- Scripts de setup/deploy de ambiente (Windows via PowerShell, Linux/Mac via Shell);
- Rotinas de automação (ex.: backups, geração de relatórios agendados, tarefas de manutenção);
- Possível suporte a múltiplos sistemas operacionais no processo de desenvolvimento/implantação, dado o projeto envolver uma secretaria de educação estadual (SEDUC-PI), cujo ambiente de infraestrutura pode variar entre servidores Windows e Linux.

Sem acesso ao conteúdo desses arquivos, não é possível confirmar detalhes exatos (ex.: se há Dockerfiles, pipelines de CI/CD, ou scripts de deploy em nuvem).

## 9. Testes (`tests/`)

A existência de uma pasta `tests/` dedicada indica preocupação com qualidade e cobertura de testes automatizados. Não foi possível confirmar o framework exato utilizado (ex.: `unittest`/`pytest` para o Django, `Jest`/`React Testing Library` para o React), mas essas são as opções mais comuns no ecossistema de cada tecnologia usada no projeto.

## 10. Recomendações para evolução da documentação

Para tornar esta documentação 100% fiel ao código real, recomenda-se:

1. Clonar o repositório e gerar a árvore de diretórios completa (`tree -L 3` ou equivalente);
2. Documentar os endpoints da API (idealmente com Swagger/OpenAPI via `drf-spectacular` ou `drf-yasg`);
3. Documentar as rotas do front-end (`react-router`);
4. Especificar o modelo de dados (models Django) usado para representar estudantes, notas, frequência e demais entidades acadêmicas;
5. Adicionar um arquivo de licença (`LICENSE`) ao repositório;
6. Preencher a seção `scripts` do `package.json` com comandos padronizados (`start`, `build`, `test`, `lint`);
7. Adicionar um arquivo `.env.example` (sem valores sensíveis) para facilitar o onboarding de novos desenvolvedores.

---

*Este documento complementa o `README.md` do projeto e foi elaborado em julho de 2026 com base nas informações públicas disponíveis no repositório GitHub `Sh4luK/siaa-seduc`.*