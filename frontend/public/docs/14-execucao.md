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
