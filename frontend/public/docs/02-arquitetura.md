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
