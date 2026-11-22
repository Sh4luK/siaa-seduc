## 11. Autenticação e Sessões
- Login por perfil: `POST /api/<perfil>/login` com `nome_completo`/`senha` (ou CPF/email conforme perfil).
- Senhas armazenadas em texto plano nos models (`senha = CharField`) — **ver Limitações**.
- Sessão Django persistida no model `Sessao` e entregue via cookie HttpOnly.
- `credentials: "include"` em todos os fetches do frontend.
- Endpoints validam ownership (ex.: professor só acessa avaliações próprias; coordenador só sua escola).

---
