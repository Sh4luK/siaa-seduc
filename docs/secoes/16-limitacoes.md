## 16. Limitações Conhecidas
1. **Senhas em texto plano** em todos os models de usuário — recomenda-se migrar para hash (`make_password`/`check_password`).
2. **`@csrf_exempt` generalizado** — a API depende apenas de cookie de sessão; avaliar CSRF token ou SameSite.
3. **Validação de uploads** inconsistente — nem todos os endpoints verificam MIME/tamanho.
4. **Serialização manual** em `views.py` — ~8.800 linhas; candidato a DRF serializers ou refatoração por domínio.
5. **Sem testes automatizados** significativos — `tests/` existe mas cobertura é limitada.
6. **Correção de avaliações** armazena foto + nota, mas **não há correção automática** (OMR/OCR) — a nota é informada manualmente pelo professor.
7. **`next build`** já foi bloqueado por erros de sintaxe em páginas de aluno — manter lint/build verde.
8. **Campos `FileField`** (atividades/conteúdos) não são editáveis via CRUD genérico do admin.
9. **Mensagens de chat** não são gerenciáveis individualmente (apenas a conversa).
10. **xhtml2pdf** impõe restrições de CSS (sem gradientes, `:first`, pseudo-elementos complexos).

---
