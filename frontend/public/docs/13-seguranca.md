## 13. Segurança
**Implementado:**
- Verificação de autenticação e ownership nos endpoints sensíveis.
- Sessões por cookie (não JWT em localStorage).
- `unique_together`/constraints no banco para integridade.
- Validação de entrada básica (tipos, obrigatórios) nos novos endpoints genéricos.

**Débitos técnicos (ver seção 16):**
- Senhas em texto plano.
- CSRF desabilitado globalmente (`@csrf_exempt`) — aceitável para API por cookie somente se houver proteção equivalente; recomendo revisar.
- Uploads sem validação rigorosa de tipo/tamanho em todos os endpoints.

---
