## 15. Deploy e Infraestrutura
- **Frontend**: Vercel — deploy automático por push na branch principal.
- **Backend**: Django + PostgreSQL; variáveis de ambiente via `.env`/`python-dotenv`.
- **Mídia**: `django_siaa/media/` servida via rota `/backend-api/media/` no proxy.
- **CI**: `.github/` presente; scripts em `infra/` e `commit.sh`.

---
