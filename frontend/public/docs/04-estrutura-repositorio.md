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
