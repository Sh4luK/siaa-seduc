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
