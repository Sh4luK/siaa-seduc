# Copilot Instructions for SIAA-SEDUC

## Project Overview

**SIAA-SEDUC** (Sistema Integrado de Acompanhamento Acadêmico) is an academic management platform for Piauí's state education network. The codebase is a full-stack monorepo with:
- **Backend:** Django + Django REST Framework (DRF) API
- **Frontend:** Next.js 16 + React 19 with CSS Modules and Bootstrap

The platform serves three user roles: **Alunos** (Students), **Professores** (Teachers), and **Coordenação** (Coordination).

---

## Build, Test & Development Commands

### Backend (Django)
```bash
cd django_siaa

# Setup
python -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver 0.0.0.0:8000

# Run admin creation script (if needed)
python app/create_admin.py

# Run admin interface
# Access at http://localhost:8000/admin
```

**Database:** SQLite in development (db.sqlite3), PostgreSQL in production.

### Frontend (Next.js)
```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev
# Access at http://localhost:3000

# Production build
npm build

# Start production server
npm start

# Linting
npm run lint
# (Uses ESLint with Next.js config)
```

**Note:** React Compiler is enabled in `next.config.mjs` for optimization.

---

## Architecture & Data Flow

### Backend Structure
- **models.py:** Core domain models—Professor, Estudante, AtravessaPor (teacher-class mapping), Nota (grades), Disciplina, Frequencia, Aula, Evento, Conteudo, Atividade, Comunicado, Coordenador, Advertencia.
- **views.py:** REST endpoints using DRF (2785 lines). Handles authentication, CRUD operations, and business logic.
- **funcs/:** Utility functions (e.g., `get_ip.py` for IP tracking).
- **management/:** Django management commands.

**Key Models:**
- **Nota:** Stores 3-trimester grades (NM1/NM2/NM3, RPT, MT, MTF per trimester, plus annual MA/PF/MAF). Uses DecimalField(max_digits=4, decimal_places=2).
- **AtravessaPor:** Links Professor → Turma (class) with school, etapa (stage), and discipline info. Used as FK in Nota to ensure grade data is tied to a specific teacher-class assignment.
- **Frequencia:** Tracks student attendance per class.

**Authentication:** Credential-based (username/password). Views use `@csrf_exempt` for API endpoints. IP tracking is implemented (`ip` field on Professor and Estudante).

**Data Import:** JSON files in `infra/` and `django_siaa/` (alunos_formatados.json, turmas_exportadas.json, etc.) are loaded at runtime for reference data. Database may include imported data fixtures.

### Frontend Structure
**App Router (Next.js 13+):** Located in `frontend/src/app/`
- **Routing:** File-based routing. Dynamic segments use brackets: `[turmaId]`, `[alunoId]`
- **Page Modules:** Each page has an associated `.module.css` for scoped styles
- **Modules:**
  - `/aluno` — Student login & boletim (report card) view
  - `/professor` — Teacher dashboard, turmas (classes), notas (grades), frequencia (attendance), conteudos, atividades, comunicados, calendario
  - `/coordenacao` — Admin panel for managing professors, students, calendar events

**Styling:**
- CSS Modules (`*.module.css`) for scoped styles
- Bootstrap 5.3.8 for pre-built components (imported globally in layout.js)
- Tailwind CSS v4 configured but CSS Modules are primary
- PostCSS configured for CSS transforms

**Components:** Located in `frontend/src/components/`
- LoginAuth.js — Handles API login calls via axios
- Stateful components load data from API (axios requests to Django backend)

---

## Key Conventions & Patterns

### Backend (Django/Python)

1. **Model Naming:** CamelCase (e.g., `Estudante`, `AtravessaPor`, `Coordenador`). Database relationships use `related_name` for reverse queries.

2. **Decimal Precision:** Grades stored as `DecimalField(max_digits=4, decimal_places=2)` to prevent floating-point errors. Use `Decimal()` constructor when working with grades.

3. **Grade Calculation:** Annual grades (MA, PF, MAF, RCF) computed from trimester data (T1, T2, T3). Common abbreviations:
   - **NM1/NM2/NM3:** Individual assessments per trimester
   - **RPT:** Exam per trimester
   - **MT:** Monthly average (media trimestral)
   - **MTF:** Final trimester average
   - **MA:** Annual average
   - **PF:** Final exam
   - **MAF:** Final annual average
   - **RCF:** Final result code (linked to RF_CHOICES)
   - **RF:** Result status (CUR, AP, RE, DE, FA, AB, TR, CA, TT, TO, PP, ND)
   - **TGF:** Total absences

4. **Views Pattern:** `@csrf_exempt` decorators on API endpoints. Use `json.loads(request.POST)` or `request.GET.get()` for parameters. Return `JsonResponse` with `ensure_ascii=False` for Portuguese text.

5. **File Paths:** Utility functions handle multiple possible locations for JSON data files (e.g., `/workspaces/siaa-seduc/infra/` or relative to app).

6. **Database Migrations:** Schema changes go in `app/migrations/`. Use `python manage.py makemigrations` and `python manage.py migrate`.

### Frontend (Next.js/React)

1. **Page Components:** Use `"use client"` directive for interactivity. Default export function named after route (e.g., `Aluno`, `Professor`, `Login`).

2. **State & Auth Verification:** Pages typically:
   - Use `useState` for local state (authenticated, loading, data)
   - Call API endpoint to verify authentication on mount with `useEffect`
   - Redirect unauthenticated users via `router.push()` from `next/navigation`
   - Fetch data from API once authenticated

3. **API URL:** Hardcoded base URL in most components (e.g., `API_BASE = "https://..."`) — **should be moved to env variables** but currently inline.

4. **Data Fetching:** Use both `fetch` API and `axios` (imported in LoginAuth.js). Prefer `axios` for consistency in login flows.

5. **Styling:** CSS Modules for component-specific styles. Import as `styles` and apply via `className={styles.className}`. Bootstrap classes available globally.

6. **Dynamic Routes:** Access route params via `params` prop destructuring:
   ```javascript
   export default function Page({ params }) {
     const { turmaId, alunoId } = params;
     // ...
   }
   ```

7. **Navigation:** Use `Link` from `next/link` for client-side navigation, `useRouter().push()` for programmatic navigation.

---

## Repository Structure Reference

```text
siaa-seduc/
├── django_siaa/                    # Backend (Django + DRF)
│   ├── app/
│   │   ├── models.py              # Domain models
│   │   ├── views.py               # API endpoints
│   │   ├── admin.py               # Django admin config
│   │   ├── funcs/                 # Utility functions
│   │   ├── management/            # Management commands
│   │   ├── migrations/            # DB schema
│   │   └── tests.py
│   ├── django_siaa/               # Project settings
│   │   ├── settings.py            # Config & middleware
│   │   ├── urls.py                # URL routing
│   │   └── wsgi.py / asgi.py
│   ├── manage.py
│   └── requirements.txt            # Python dependencies
├── frontend/                       # Frontend (Next.js + React)
│   ├── src/
│   │   ├── app/                   # Pages (App Router)
│   │   │   ├── aluno/             # Student module
│   │   │   ├── professor/         # Teacher module
│   │   │   ├── coordenacao/       # Admin module
│   │   │   ├── layout.js          # Root layout
│   │   │   └── page.js            # Home page
│   │   ├── components/            # Reusable components
│   │   └── assets/                # Images, static files
│   ├── package.json
│   ├── next.config.mjs            # Next.js config
│   ├── postcss.config.mjs         # PostCSS config
│   ├── eslint.config.mjs          # ESLint rules
│   └── CLAUDE.md / AGENTS.md      # AI-specific instructions
├── tests/                          # Test pages & validation scripts
├── DOCUMENTATION.md               # Full API & architecture docs
├── README.md                      # Project overview
└── requirements.txt               # Python dependencies
```

---

## Important Notes

1. **Portuguese Locale:** Project uses Brazilian Portuguese extensively (variable names, UI text). Maintain this convention.

2. **Data Integrity:** Grades are critical data. Always validate Decimal values and trim before DB operations using `Trim()`, `Replace()` in ORM queries where appropriate.

3. **CORS Configuration:** Enabled via `django-cors-headers` middleware in `settings.py`. Ensure frontend API calls respect CORS headers.

4. **Env Variables:** Backend loads `.env` via `python-dotenv`. Frontend hardcodes API base URL—should be migrated to environment-based config.

5. **Database:** SQLite for development (auto-created on first migration), PostgreSQL for production (requires connection string in settings).

6. **Version Info:** Next.js 16.2.6, React 19.2.4, Django 5.x+, Python 3.10+.

---

## Testing & Quality Assurance

**Frontend (E2E Testing with Playwright):**
- Playwright is recommended for end-to-end testing of user flows (login, grade submission, report viewing, etc.)
- Install: `npm install -D @playwright/test` (in frontend directory)
- Test files go in `frontend/tests/` directory
- Run tests: `npx playwright test`
- Focus on testing critical user journeys: student login → view boletim, teacher login → enter grades → submit

**Backend (Django Tests):**
- Test files: `app/tests.py`
- Run: `python manage.py test`
- Test grade calculations, API endpoints, permission checks, and data validation

**Linting:**
- Frontend: `npm run lint` (ESLint + Next.js rules)
- Backend: Use `flake8` or `black` (if configured)

---

## Common Tasks

- **Add a new API endpoint:** Add view function in `app/views.py`, update `django_siaa/urls.py`, return `JsonResponse`.
- **Add a new data model:** Define in `app/models.py`, run `makemigrations` & `migrate`, add admin registration if needed.
- **Add a new frontend page:** Create file in `frontend/src/app/[module]/[page]/page.js`, add corresponding `.module.css`, import Bootstrap/styles as needed.
- **Fetch student/teacher data:** Use `/api/students/`, `/api/teacher/` endpoints. Auth tokens/sessions managed via views.
- **Grade calculations:** Implement logic in backend views; frontend displays results. Use Decimal arithmetic to avoid rounding errors.
- **Test user flows:** Use Playwright to write E2E tests for critical flows like authentication, grade entry, and report viewing.
